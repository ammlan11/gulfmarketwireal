"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

import {
  LEAD_MAGNET,
  LEAD_MAGNET_EXCLUDED_PATHS,
  LEAD_MAGNET_TIMING,
} from "@/lib/lead-magnet";

import styles from "./LeadMagnetPopup.module.scss";

const STORAGE_KEY = `gmw_lead_magnet_${LEAD_MAGNET.id}`;

type StoredStatus = "dismissed" | "submitted";

/*
 * "submitted" is remembered permanently (localStorage).
 * "dismissed" only lasts for the current visit (sessionStorage),
 * so the panel slides out again next time they come to the site.
 */
function readStoredState(): StoredStatus | null {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "submitted") {
      return "submitted";
    }

    if (window.sessionStorage.getItem(STORAGE_KEY) === "dismissed") {
      return "dismissed";
    }
  } catch {
    // Storage can be unavailable (private mode); the popup still works.
  }

  return null;
}

function writeStoredState(status: StoredStatus) {
  try {
    const storage =
      status === "submitted" ? window.localStorage : window.sessionStorage;

    storage.setItem(STORAGE_KEY, status);
  } catch {
    // Storage can be unavailable (private mode); the popup still works.
  }
}

/*
 * Should the panel slide out by itself on this page?
 */
function isEligible(pathname: string): boolean {
  const excluded = LEAD_MAGNET_EXCLUDED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (excluded) {
    return false;
  }

  return readStoredState() === null;
}

export default function LeadMagnetPopup() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  // Opened by the visitor (launcher button) vs. automatically.
  const [openedByUser, setOpenedByUser] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isTrader, setIsTrader] = useState<boolean | null>(null);
  const [company, setCompany] = useState(""); // honeypot

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // =========================
  // TRIGGER: time on page or scroll depth
  // =========================

  useEffect(() => {
    if (!isEligible(pathname)) {
      return;
    }

    let shown = false;

    function show() {
      if (shown) return;

      shown = true;

      // Re-check in case the popup was dismissed in another tab.
      if (isEligible(pathname)) {
        setOpenedByUser(false);
        setOpen(true);
      }

      cleanup();
    }

    function handleScroll() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      if (
        scrollable > 0 &&
        window.scrollY / scrollable >= LEAD_MAGNET_TIMING.scrollRatio
      ) {
        show();
      }
    }

    const timer = window.setTimeout(show, LEAD_MAGNET_TIMING.delayMs);

    window.addEventListener("scroll", handleScroll, { passive: true });

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    }

    return cleanup;
  }, [pathname]);

  // =========================
  // CLOSE
  // =========================

  const close = useCallback(() => {
    setOpen(false);

    if (!downloadUrl) {
      writeStoredState("dismissed");
    }
  }, [downloadUrl]);

  // While open: Escape closes, the page behind can't scroll,
  // and focus moves into the popup.
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    // Typing straight away only when they asked for it; an automatic
    // popup just takes focus (so phones don't pop up the keyboard).
    if (openedByUser) {
      firstFieldRef.current?.focus();
    } else {
      dialogRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, openedByUser, close]);

  // =========================
  // LAUNCHER (bottom-left button)
  // =========================

  function openFromLauncher() {
    // Someone who already signed up goes straight to the download.
    if (!downloadUrl && readStoredState() === "submitted") {
      setDownloadUrl(LEAD_MAGNET.pdfPath);
    }

    setOpenedByUser(true);
    setOpen(true);
  }

  // =========================
  // SUBMIT
  // =========================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          isTrader,
          company,
          pagePath: pathname,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.message ?? "Something went wrong. Please try again.");
        return;
      }

      writeStoredState("submitted");
      setDownloadUrl(data.downloadUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const hidden = LEAD_MAGNET_EXCLUDED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (hidden) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        className={styles.launcher}
        onClick={openFromLauncher}
        aria-label={`${LEAD_MAGNET.eyebrow}: ${LEAD_MAGNET.title}`}
      >
        <span className={styles.launcherIcon} aria-hidden="true">
          ↓
        </span>
        {LEAD_MAGNET.eyebrow.charAt(0) +
          LEAD_MAGNET.eyebrow.slice(1).toLowerCase()}
      </button>
    );
  }

  return (
    <div
      className={styles.overlay}
      // Set inline: the CSS build step strips backdrop-filter from stylesheets.
      style={{
        backdropFilter: "blur(10px) saturate(120%)",
        WebkitBackdropFilter: "blur(10px) saturate(120%)",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-magnet-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close"
        >
          ×
        </button>

        <aside className={styles.visual} aria-hidden="true">
          <span className={styles.ribbon}>{LEAD_MAGNET.badge}</span>

          <Image
            src={LEAD_MAGNET.coverImage}
            alt=""
            width={320}
            height={452}
            className={styles.cover}
          />

          <ul className={styles.facts}>
            {LEAD_MAGNET.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </aside>

        <div className={styles.content}>
        <span className={styles.eyebrow}>{LEAD_MAGNET.eyebrow}</span>

        <h2 id="lead-magnet-title">{LEAD_MAGNET.title}</h2>

        {downloadUrl ? (
          // =========================
          // SUCCESS
          // =========================
          <div className={styles.success}>
            <p>Thanks, {name.trim().split(" ")[0]}. Your report is ready.</p>

            <a
              href={downloadUrl}
              className={styles.submit}
              target="_blank"
              rel="noopener"
              download
            >
              Download the PDF ↓
            </a>

            <button type="button" className={styles.secondary} onClick={close}>
              Back to the news
            </button>
          </div>
        ) : (
          // =========================
          // FORM
          // =========================
          <>
            <p className={styles.description}>{LEAD_MAGNET.description}</p>

            <ul className={styles.bullets}>
              {LEAD_MAGNET.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <label>
                <span>Name</span>
                <input
                  ref={firstFieldRef}
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>
                  Phone / WhatsApp <em>(optional)</em>
                </span>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <fieldset className={styles.trader}>
                <legend>
                  Do you trade? <em>(optional)</em>
                </legend>

                <div>
                  <button
                    type="button"
                    className={isTrader === true ? styles.selected : ""}
                    aria-pressed={isTrader === true}
                    onClick={() => setIsTrader(isTrader === true ? null : true)}
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    className={isTrader === false ? styles.selected : ""}
                    aria-pressed={isTrader === false}
                    onClick={() =>
                      setIsTrader(isTrader === false ? null : false)
                    }
                  >
                    No
                  </button>
                </div>
              </fieldset>

              {/* Honeypot field for bots — hidden from people */}
              <input
                className={styles.honeypot}
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? "Sending…" : `${LEAD_MAGNET.buttonLabel} →`}
              </button>

              <p className={styles.fineprint}>
                We&apos;ll email you market updates from Gulf Market Wire. You
                can unsubscribe at any time. See our{" "}
                <a href="/privacy" target="_blank" rel="noopener">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
