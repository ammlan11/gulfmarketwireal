"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ADMIN_TIME_ZONE,
  LEAD_TABS,
  LEAD_TAB_LABELS,
  type LeadTab,
} from "@/lib/leads-config";

import styles from "./LeadsPanel.module.scss";

export type LeadRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isTrader: boolean | null;
  magnet: string;
  pagePath: string | null;
  createdAt: string;
  extractedAt: string;
};

type Props = {
  tab: LeadTab;
  counts: Record<LeadTab, number>;
  rows: LeadRow[];
  page: number;
  totalPages: number;
};

const TAB_HINTS: Record<LeadTab, string> = {
  new: "Leads from the last 24 hours that haven't been exported yet.",
  old: "Leads older than 24 hours that haven't been exported yet.",
  extracted:
    "Leads already exported to Excel. Downloading them again doesn't change anything.",
};

function tabHref(tab: LeadTab, page = 1) {
  return `/admin/leads?tab=${tab}${page > 1 ? `&page=${page}` : ""}`;
}

export default function LeadsPanel({
  tab,
  counts,
  rows,
  page,
  totalPages,
}: Props) {
  const router = useRouter();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isExtractedTab = tab === "extracted";
  const allOnPageSelected =
    rows.length > 0 && rows.every((row) => selected.has(row.id));

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  function toggleAll() {
    setSelected(
      allOnPageSelected ? new Set() : new Set(rows.map((row) => row.id)),
    );
  }

  // =========================
  // EXPORT TO EXCEL
  // =========================

  async function exportLeads(ids: number[] | null) {
    const total = ids ? ids.length : counts[tab];

    if (
      !isExtractedTab &&
      !window.confirm(
        `Export ${total} lead${total === 1 ? "" : "s"} to Excel?\n\nThey will move to Extracted Leads.`,
      )
    ) {
      return;
    }

    setExporting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/leads/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { tab, ids } : { tab }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message ?? "Export failed.");
      }

      const blob = await response.blob();

      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? "leads.xlsx";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const exported = Number(response.headers.get("X-Lead-Count") ?? total);

      setSelected(new Set());
      setMessage(
        isExtractedTab
          ? `Downloaded ${exported} lead${exported === 1 ? "" : "s"}.`
          : `Exported ${exported} lead${exported === 1 ? "" : "s"} — moved to Extracted Leads.`,
      );

      if (!isExtractedTab) {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <div>
            <span className={styles.eyebrow}>ADMIN</span>
            <h1>Leads</h1>
          </div>

          <span className={styles.timezone}>
            Times shown in {ADMIN_TIME_ZONE.split("/").pop()} time
          </span>
        </div>

        {/* =========================
            TABS
        ========================= */}

        <nav className={styles.tabs} aria-label="Lead lists">
          {LEAD_TABS.map((t) => (
            <Link
              key={t}
              href={tabHref(t)}
              className={t === tab ? styles.activeTab : styles.tab}
              aria-current={t === tab ? "page" : undefined}
            >
              {LEAD_TAB_LABELS[t]}
              <span className={styles.count}>{counts[t]}</span>
            </Link>
          ))}
        </nav>

        <p className={styles.hint}>{TAB_HINTS[tab]}</p>

        {/* =========================
            TOOLBAR
        ========================= */}

        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={exporting || selected.size === 0}
            onClick={() => exportLeads([...selected])}
          >
            {isExtractedTab ? "Download selected" : "Export selected"}
            {selected.size > 0 ? ` (${selected.size})` : ""}
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            disabled={exporting || counts[tab] === 0}
            onClick={() => exportLeads(null)}
          >
            {exporting
              ? "Preparing Excel…"
              : `${isExtractedTab ? "Download all" : "Export all"} ${counts[tab]} to Excel`}
          </button>
        </div>

        {message && (
          <p className={styles.success} role="status">
            {message}
          </p>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {/* =========================
            TABLE
        ========================= */}

        {rows.length === 0 ? (
          <div className={styles.empty}>
            No {LEAD_TAB_LABELS[tab].toLowerCase()} right now.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkCell}>
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone / WhatsApp</th>
                  <th>Trader</th>
                  <th>Report</th>
                  <th>Page</th>
                  <th>Submitted</th>
                  {isExtractedTab && <th>Extracted</th>}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={selected.has(row.id) ? styles.selectedRow : ""}
                  >
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.name}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                      />
                    </td>
                    <td className={styles.strong}>{row.name}</td>
                    <td>
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    </td>
                    <td>
                      {row.phone ? (
                        <a href={`tel:${row.phone}`}>{row.phone}</a>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td>
                      {row.isTrader === null ? (
                        <span className={styles.muted}>—</span>
                      ) : row.isTrader ? (
                        <span className={styles.badge}>Yes</span>
                      ) : (
                        "No"
                      )}
                    </td>
                    <td>{row.magnet}</td>
                    <td className={styles.path}>{row.pagePath ?? "—"}</td>
                    <td className={styles.nowrap}>{row.createdAt}</td>
                    {isExtractedTab && (
                      <td className={styles.nowrap}>{row.extractedAt}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================
            PAGINATION
        ========================= */}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            {page > 1 ? (
              <Link href={tabHref(tab, page - 1)}>← Previous</Link>
            ) : (
              <span />
            )}

            <span>
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <Link href={tabHref(tab, page + 1)}>Next →</Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
