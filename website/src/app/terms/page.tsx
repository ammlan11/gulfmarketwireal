import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/layout/Header/Header";
import LegalPage, {
  LegalEmail,
  LegalValue,
} from "@/components/legal/LegalPage/LegalPage";

import { LEGAL } from "@/lib/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms that apply when you use ${SITE_NAME}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const company = (
    <LegalValue value={LEGAL.companyName} placeholder="company legal name" />
  );
  const email = <LegalEmail value={LEGAL.contactEmail} />;

  return (
    <>
      <Header />

      <LegalPage
        title="Terms of Use"
        lastUpdated={LEGAL.lastUpdated}
        intro={
          <p>
            These terms apply when you use {SITE_NAME} (gulfmarketwire.com),
            operated by {company}. By using the site you agree to them. If you
            don&apos;t agree, please don&apos;t use the site.
          </p>
        }
      >
        <h2>Not investment advice</h2>
        <p>
          Everything on {SITE_NAME}, including articles, market data, guides
          and other downloads, is general information and news. It is not
          investment, financial, legal or tax advice, and it is not a
          recommendation to buy or sell any security or other product.
        </p>
        <p>
          Markets carry risk, including the loss of your capital. Make your own
          decisions and get independent professional advice before you invest.
          We are not responsible for decisions you make based on our content.
        </p>

        <h2>Market data</h2>
        <p>
          Prices and other market data come from third-party providers. They
          may be delayed or contain errors and are shown for information only.
          Don&apos;t rely on them for trading.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>You must be at least 18 to create an account.</li>
          <li>Give accurate details and keep them up to date.</li>
          <li>
            Keep your password secure. You are responsible for activity on your
            account.
          </li>
          <li>
            We may suspend or close accounts that break these terms or are used
            to misuse the site.
          </li>
        </ul>

        <h2>Using the site</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Copy, republish or sell our content without written permission</li>
          <li>Scrape or collect data from the site using automated tools</li>
          <li>
            Interfere with the site&apos;s security or operation, or try to
            access areas you aren&apos;t authorised to use
          </li>
          <li>Submit false information or someone else&apos;s details in our forms</li>
        </ul>

        <h2>Our content</h2>
        <p>
          The site&apos;s content, design, logo and name belong to {company} or
          our licensors. You may read and share links to our articles and save
          free guides for your own personal use.
        </p>
        <p>
          Some articles summarise or link to reports from other publishers.
          Those publishers own their content, and we are not responsible for
          external websites.
        </p>

        <h2>Free guides and emails</h2>
        <p>
          When you request a free guide, we use your details as described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>, including sending you
          market updates. You can unsubscribe at any time.
        </p>

        <h2>No guarantees</h2>
        <p>
          We work to keep our content accurate and the site available, but we
          provide them &quot;as is&quot; and can&apos;t guarantee they will
          always be complete, current or error-free.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the extent the law allows, {company} is not liable for any loss or
          damage arising from your use of the site or reliance on its content,
          including investment or trading losses.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. The &quot;last updated&quot; date above
          shows when they last changed. Continuing to use the site after a
          change means you accept the updated terms.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of{" "}
          <LegalValue value={LEGAL.governingLaw} placeholder="governing country" />.
          If you live in {LEGAL.otherMarkets}, you also keep any rights your
          local law gives you that can&apos;t be excluded by agreement.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms: {email}
          <br />
          {company}, <LegalValue value={LEGAL.companyAddress} placeholder="registered address" />
        </p>
      </LegalPage>
    </>
  );
}
