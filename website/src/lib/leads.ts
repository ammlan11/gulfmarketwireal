import type { Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import {
  ADMIN_TIME_ZONE,
  NEW_LEAD_WINDOW_MS,
  type LeadTab,
} from "@/lib/leads-config";

export * from "@/lib/leads-config";

/*
 * Server-only helpers for the admin leads panel.
 */

export function leadWhereForTab(
  tab: LeadTab,
  now = new Date(),
): Prisma.LeadWhereInput {
  const cutoff = new Date(now.getTime() - NEW_LEAD_WINDOW_MS);

  switch (tab) {
    case "new":
      return { extractedAt: null, createdAt: { gte: cutoff } };

    case "old":
      return { extractedAt: null, createdAt: { lt: cutoff } };

    case "extracted":
      return { extractedAt: { not: null } };
  }
}

export function leadOrderForTab(
  tab: LeadTab,
): Prisma.LeadOrderByWithRelationInput[] {
  return tab === "extracted"
    ? [{ extractedAt: "desc" }, { createdAt: "desc" }]
    : [{ createdAt: "desc" }];
}

export function formatAdminDate(date: Date | null): string {
  if (!date) return "";

  return date.toLocaleString("en-GB", {
    timeZone: ADMIN_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/*
 * Returns the signed-in user only if they are an admin.
 */
export async function getAdminUser() {
  const user = await getCurrentUser();

  return user?.role === "ADMIN" ? user : null;
}
