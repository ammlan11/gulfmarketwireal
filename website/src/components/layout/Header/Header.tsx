import Link from "next/link";
import Image from "next/image";

import Navbar from "../Navbar/Navbar";
import UserMenu from "@/components/layout/UserMenu/UserMenu";

import { getCurrentUser } from "@/lib/auth";

import type { MarketQuote } from "@/types/market-quote";

import styles from "./Header.module.scss";

type Props = {
  marketQuotes?: MarketQuote[];
};

export default async function Header({ marketQuotes = [] }: Props) {
  const user = await getCurrentUser();

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/GMW-01.svg"
              alt="GMW"
              width={220}
              height={60}
              priority
            />
          </Link>

          <div className={styles.actions}>
            <UserMenu initialUser={user} />
          </div>
        </div>
      </div>

      <Navbar marketQuotes={marketQuotes} />
    </header>
  );
}
