import ExcelJS from "exceljs";

import { prisma } from "@/lib/prisma";
import { validateCsrfHeader } from "@/lib/rate-limit";
import {
  ADMIN_TIME_ZONE,
  LEAD_TAB_LABELS,
  formatAdminDate,
  getAdminUser,
  isLeadTab,
  leadOrderForTab,
  leadWhereForTab,
} from "@/lib/leads";

// Safety cap for a single export.
const MAX_EXPORT_ROWS = 20_000;

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message }, { status });
}

/*
 * POST /api/admin/leads/export
 *
 * Body: { tab: "new" | "old" | "extracted", ids?: number[] }
 *
 * Builds an Excel file of the requested leads.
 * Leads exported from the New or Old tab are marked
 * as extracted, which moves them to the Extracted tab.
 * Exporting from the Extracted tab re-downloads them
 * without changing anything.
 */
export async function POST(request: Request) {
  if (!validateCsrfHeader(request)) {
    return jsonError("Cross-site request blocked.", 403);
  }

  const admin = await getAdminUser();

  if (!admin) {
    return jsonError("Admin access required.", 403);
  }

  const body = await request.json().catch(() => ({}));

  const tab: unknown = body.tab;

  if (!isLeadTab(tab)) {
    return jsonError("Unknown tab.", 400);
  }

  const ids: number[] | null = Array.isArray(body.ids)
    ? body.ids
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isInteger(id) && id > 0)
    : null;

  if (ids && ids.length === 0) {
    return jsonError("No leads selected.", 400);
  }

  const leads = await prisma.lead.findMany({
    where: {
      ...leadWhereForTab(tab),
      ...(ids ? { id: { in: ids } } : {}),
    },
    orderBy: leadOrderForTab(tab),
    take: MAX_EXPORT_ROWS,
  });

  if (leads.length === 0) {
    return jsonError("There are no leads to export.", 404);
  }

  const exportedAt = new Date();

  // ============================
  // BUILD THE WORKBOOK
  // ============================

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Gulf Market Wire";
  workbook.created = exportedAt;

  const sheet = workbook.addWorksheet("Leads", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const timeLabel = `(${ADMIN_TIME_ZONE.split("/").pop()} time)`;

  sheet.columns = [
    { header: "Name", key: "name", width: 26 },
    { header: "Email", key: "email", width: 34 },
    { header: "Phone / WhatsApp", key: "phone", width: 20 },
    { header: "Trader", key: "trader", width: 10 },
    { header: "Report", key: "magnet", width: 30 },
    { header: "Signed up on page", key: "pagePath", width: 40 },
    { header: `Submitted ${timeLabel}`, key: "createdAt", width: 24 },
    { header: `Extracted ${timeLabel}`, key: "extractedAt", width: 24 },
  ];

  for (const lead of leads) {
    sheet.addRow({
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? "",
      trader:
        lead.isTrader === null ? "" : lead.isTrader ? "Yes" : "No",
      magnet: lead.magnet,
      pagePath: lead.pagePath ?? "",
      createdAt: formatAdminDate(lead.createdAt),
      extractedAt: formatAdminDate(lead.extractedAt ?? exportedAt),
    });
  }

  const header = sheet.getRow(1);

  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF000000" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();

  // ============================
  // MARK AS EXTRACTED
  // ============================

  /*
   * Only after the file has been built, so a failed
   * export never moves leads without a file.
   */
  if (tab !== "extracted") {
    await prisma.lead.updateMany({
      where: {
        id: { in: leads.map((lead) => lead.id) },
        extractedAt: null,
      },
      data: { extractedAt: exportedAt },
    });
  }

  const dateStamp = exportedAt.toLocaleDateString("en-CA", {
    timeZone: ADMIN_TIME_ZONE,
  });

  const filename = `gmw-${LEAD_TAB_LABELS[tab]
    .toLowerCase()
    .replace(/\s+/g, "-")}-${dateStamp}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Lead-Count": String(leads.length),
    },
  });
}
