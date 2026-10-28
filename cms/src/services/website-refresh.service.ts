import { env } from "../config/env";

/*
 * Tell the public website to refresh right away.
 *
 * Called after an editor publishes, unpublishes, edits or deletes an
 * article, or changes the Top Story. Without it the website keeps showing
 * its cached pages for up to ~10 minutes.
 *
 * Needs two settings in cms/.env (leave them blank to switch this off):
 *   WEBSITE_REVALIDATE_URL=https://gulfmarketwire.com/api/revalidate
 *   WEBSITE_REVALIDATE_SECRET=<same value as REVALIDATE_SECRET on the website>
 *
 * Never throws and never delays the editor: if the website can't be
 * reached, it just logs a warning and the pages refresh on their normal
 * 5-minute schedule.
 */
export function refreshWebsite(reason: string): void {
  const url = env.WEBSITE_REVALIDATE_URL;
  const secret = env.WEBSITE_REVALIDATE_SECRET;

  if (!url || !secret) return;

  void fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
    signal: AbortSignal.timeout(5000),
  })
    .then((response) => {
      if (!response.ok) {
        console.warn(`[website-refresh] ${reason}: website answered ${response.status}`);
      }
    })
    .catch((error) => {
      console.warn(`[website-refresh] ${reason}: could not reach the website`, error?.message ?? error);
    });
}
