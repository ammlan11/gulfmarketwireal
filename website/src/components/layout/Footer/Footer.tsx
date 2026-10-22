import Link from "next/link";
import styles from "./Footer.module.scss";
import Image from "next/image";


const footerColumns = [
  {
    title: "Markets",
    links: [
      { label: "Stocks", href: "/markets" },
      { label: "Currencies", href: "/markets" },
      { label: "Commodities", href: "/markets" },
      { label: "Rates & Bonds", href: "/markets" },
    ],
  },
  {
    title: "GMW",
    links: [
      { label: "Banking", href: "/finance" },
      { label: "Investing", href: "/finance" },
      { label: "Private Markets", href: "/finance" },
      { label: "Wealth", href: "/finance" },
    ],
  },
  {
    title: "News",
    links: [
      { label: "Economics", href: "/economics" },
      { label: "Tech", href: "/tech" },
      { label: "Live TV", href: "/live-tv" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
  <Link href="/" aria-label="Go to home page">
    <Image
      src="/images/GMW-01.svg"
      alt="GMW"
      width={180}
      height={60}
      priority
    />
  </Link>
</div>

            <p>
              Global financial news, markets, economics and technology
              coverage in one place.
            </p>
          </div>

          <div className={styles.columns}>
            {footerColumns.map((column) => (
              <div key={column.title} className={styles.column}>
                <h3>{column.title}</h3>

                {column.links.map((link) => (
                  <Link key={link.label} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} Gulf Market Wire. All rights reserved.
          </span>

          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy#cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}