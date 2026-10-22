import { notFound, redirect } from "next/navigation";

import Header from "@/components/layout/Header/Header";
import LeadsPanel, {
  type LeadRow,
} from "@/components/admin/LeadsPanel/LeadsPanel";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  LEADS_PAGE_SIZE,
  LEAD_TABS,
  formatAdminDate,
  isLeadTab,
  leadOrderForTab,
  leadWhereForTab,
  type LeadTab,
} from "@/lib/leads";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leads · Admin",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminLeadsPage({ searchParams }: Props) {
  // =========================
  // ACCESS CONTROL
  // =========================

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Non-admins get a normal 404 so the page's existence isn't revealed.
  if (user.role !== "ADMIN") {
    notFound();
  }

  // =========================
  // TAB + PAGE
  // =========================

  const params = await searchParams;

  const tab: LeadTab = isLeadTab(params.tab) ? params.tab : "new";

  const requestedPage = Number(params.page);

  const now = new Date();

  // =========================
  // DATA
  // =========================

  const counts = Object.fromEntries(
    await Promise.all(
      LEAD_TABS.map(
        async (t) =>
          [t, await prisma.lead.count({ where: leadWhereForTab(t, now) })] as const,
      ),
    ),
  ) as Record<LeadTab, number>;

  const totalPages = Math.max(1, Math.ceil(counts[tab] / LEADS_PAGE_SIZE));

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1;

  const leads = await prisma.lead.findMany({
    where: leadWhereForTab(tab, now),
    orderBy: leadOrderForTab(tab),
    skip: (page - 1) * LEADS_PAGE_SIZE,
    take: LEADS_PAGE_SIZE,
  });

  const rows: LeadRow[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    isTrader: lead.isTrader,
    magnet: lead.magnet,
    pagePath: lead.pagePath,
    createdAt: formatAdminDate(lead.createdAt),
    extractedAt: formatAdminDate(lead.extractedAt),
  }));

  return (
    <>
      <Header />

      <LeadsPanel
        // Remount on tab/page change so selections reset.
        key={`${tab}-${page}`}
        tab={tab}
        counts={counts}
        rows={rows}
        page={page}
        totalPages={totalPages}
      />
    </>
  );
}
