/*
 * Free PDF ("lead magnet") offered in the site-wide popup.
 *
 * To launch a new report:
 *   1. Put the PDF in /public/downloads/
 *   2. Update `pdfPath` below to point to it
 *   3. Change `id` so returning visitors see the new offer
 *      (and so leads are tagged with the right report)
 */
export const LEAD_MAGNET = {
  id: "gcc-investing-guide-2026",

  eyebrow: "FREE GUIDE",

  title: "Tips for Investing in GCC Markets",

  description:
    "A practical guide to investing in the Gulf's seven stock exchanges — plus why expats working in the GCC should build a US portfolio.",

  bullets: [
    "10 practical tips for Saudi, UAE, Qatar & wider GCC markets",
    "Why expats should invest in US markets while working in the Gulf",
    "A checklist to use before you invest",
  ],

  buttonLabel: "Get the free guide",

  pdfPath: "/downloads/gcc-investing-guide.pdf",

  // Preview of the guide's cover shown in the popup.
  coverImage: "/images/gcc-guide-cover.jpg",

  // Badge on the cover panel.
  badge: "2026 EDITION",

  // Short facts shown under the cover.
  facts: ["9-page PDF", "Instant download", "100% free"],
} as const;

/*
 * Popup timing.
 */
export const LEAD_MAGNET_TIMING = {
  // Slide out this many milliseconds after a visitor arrives...
  delayMs: 3_000,

  // ...or once they've scrolled this far down, whichever comes first.
  scrollRatio: 0.5,

  // If a visitor closes it, it stays closed for the rest of that visit
  // (until they close the browser tab) and slides out again on their
  // next visit. Visitors who have signed up never see it pop out again.
} as const;

/*
 * Pages where the popup never appears.
 */
export const LEAD_MAGNET_EXCLUDED_PATHS = [
  "/login",
  "/register",
  "/account",
  "/saved",
  "/admin",
  "/privacy",
  "/terms",
];
