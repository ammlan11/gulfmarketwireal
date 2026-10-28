import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createHash, timingSafeEqual } from "crypto";

import { clearNewsCache } from "@/services/news.service";

/*
 * POST /api/revalidate
 *
 * The CMS calls this right after an editor publishes, unpublishes, edits,
 * deletes or changes the Top Story. It makes the homepage and every news
 * page rebuild on the next visit, so changes show within seconds instead
 * of after the 5-minute page cache runs out.
 *
 * Protected by a shared secret: REVALIDATE_SECRET here, and the same value
 * as WEBSITE_REVALIDATE_SECRET in the CMS .env.
 *
 *   curl -X POST https://gulfmarketwire.com/api/revalidate \
 *        -H "Authorization: Bearer <secret>"
 */

function sameSecret(provided: string, expected: string): boolean {
  // Hash both so the comparison takes the same time whatever the input.
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET;

  // Not configured: the endpoint is switched off.
  if (!expected || expected.length < 32) {
    return NextResponse.json(
      { success: false, message: "Revalidation is not configured." },
      { status: 404 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!provided || !sameSecret(provided, expected)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  // 1. Drop the in-memory article lists (5-minute cache in news.service).
  clearNewsCache();

  // 2. Mark every cached page as stale so it is rebuilt on the next visit.
  revalidatePath("/", "layout");

  return NextResponse.json({
    success: true,
    revalidatedAt: new Date().toISOString(),
  });
}
