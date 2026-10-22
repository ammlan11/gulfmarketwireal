"use client";

import Link from "next/link";
import { useState } from "react";

import MarketsMegaMenu from "../MarketsMegaMenu/MarketsMegaMenu";

import type { MarketQuote } from "@/types/market-quote";

import styles from "./Navbar.module.scss";

type Props = {
  marketQuotes?: MarketQuote[];
};

export default function Navbar({ marketQuotes = [] }: Props) {
  const [marketsOpen, setMarketsOpen] = useState(false);

  return (
    <div className={styles.navbar}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/live-tv" className={styles.liveTv}>
            <span className={styles.liveDot} />
            Live TV
          </Link>

          <Link href="/markets" className={styles.navLink}>
            Markets
          </Link>

          <Link href="/finance" className={styles.navLink}>
            Finance
          </Link>

          <Link href="/economics" className={styles.navLink}>
            Economics
          </Link>

          <Link href="/tech" className={styles.navLink}>
            Tech
          </Link>
        </nav>
      </div>
    </div>
  );
}
