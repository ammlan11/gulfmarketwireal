/*
 * Admin leads panel settings, safe to use in both
 * server and browser code.
 *
 *   New       — not yet extracted, submitted in the last 24 hours
 *   Old       — not yet extracted, submitted more than 24 hours ago
 *   Extracted — already exported to Excel
 */

export const LEAD_TABS = ["new", "old", "extracted"] as const;

export type LeadTab = (typeof LEAD_TABS)[number];

export const LEAD_TAB_LABELS: Record<LeadTab, string> = {
  new: "New Leads",
  old: "Old Leads",
  extracted: "Extracted Leads",
};

export const NEW_LEAD_WINDOW_MS = 24 * 60 * 60 * 1000;

// Dates in the admin panel and Excel files are shown in this time zone.
export const ADMIN_TIME_ZONE = "Asia/Colombo";

export const LEADS_PAGE_SIZE = 50;

export function isLeadTab(value: unknown): value is LeadTab {
  return (
    typeof value === "string" && (LEAD_TABS as readonly string[]).includes(value)
  );
}
