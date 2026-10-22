import type { Metadata } from "next";

import Header from "@/components/layout/Header/Header";
import LegalPage, {
  LegalEmail,
  LegalTable,
  LegalValue,
} from "@/components/legal/LegalPage/LegalPage";

import { LEGAL } from "@/lib/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const company = (
    <LegalValue value={LEGAL.companyName} placeholder="company legal name" />
  );
  const email = <LegalEmail value={LEGAL.contactEmail} />;

  return (
    <>
      <Header />

      <LegalPage
        title="Privacy Policy"
        lastUpdated={LEGAL.lastUpdated}
        intro={
          <p>
            This policy explains what personal information {SITE_NAME} collects,
            why we collect it and the choices you have. We don&apos;t sell your
            personal information.
          </p>
        }
      >
        <h2>Who we are</h2>
        <p>
          {SITE_NAME} (gulfmarketwire.com) is operated by {company},{" "}
          <LegalValue value={LEGAL.companyAddress} placeholder="registered address" />.
          We are responsible for the personal information described here. You can
          contact us about privacy at {email}.
        </p>

        <h2>What we collect</h2>

        <h3>When you create an account</h3>
        <ul>
          <li>Your full name, email address, country and phone number</li>
          <li>Your password, which we store only in encrypted (hashed) form</li>
          <li>Whether you are a trader</li>
          <li>
            Optional profile details you choose to add: region, industry, job
            title and seniority
          </li>
          <li>Articles you save to your account</li>
        </ul>

        <h3>When you request a free guide</h3>
        <ul>
          <li>Your name and email address</li>
          <li>Your phone or WhatsApp number and whether you trade, if you give them</li>
          <li>Which guide you requested, the page you were on and the time you signed up</li>
        </ul>

        <h3>Automatically</h3>
        <ul>
          <li>
            Your IP address, used briefly to protect our forms from spam and
            abuse
          </li>
          <li>
            Standard server logs kept by our hosting provider for security and
            troubleshooting
          </li>
        </ul>
        <p>
          We do not currently use advertising or analytics tracking on the site.
          If that changes, we will update this policy first.
        </p>

        <h2>How we use it</h2>
        <ul>
          <li>To create and run your account and keep you signed in</li>
          <li>To send you the guide you requested</li>
          <li>
            To send you market updates and news from {SITE_NAME}. You can
            unsubscribe at any time using the link in our emails or by contacting
            us.
          </li>
          <li>
            To contact you about our services where you have given us your phone
            number or asked us to
          </li>
          <li>To keep the site secure, prevent abuse and meet legal obligations</li>
        </ul>

        <h2>Who we share it with</h2>
        <p>We share personal information only with:</p>
        <ul>
          <li>
            Service providers who host the site, store our data or send our
            emails, under contracts that require them to protect it
          </li>
          <li>Authorities, when the law requires us to</li>
          <li>A buyer or successor, if our business is sold or reorganised</li>
        </ul>
        <p>We do not sell or rent your personal information.</p>

        <h2>How long we keep it</h2>
        <ul>
          <li>Account details: until you delete your account or ask us to</li>
          <li>
            Guide sign-ups: until you unsubscribe or ask us to delete them, or
            when we no longer need them for the purposes above
          </li>
          <li>Security logs: for a limited period, then deleted</li>
        </ul>

        <h2>Your choices and rights</h2>
        <p>Depending on where you live, you can ask us to:</p>
        <ul>
          <li>Give you a copy of the personal information we hold about you</li>
          <li>Correct information that is wrong</li>
          <li>Delete your information</li>
          <li>Stop sending you marketing</li>
        </ul>
        <p>
          Email {email} and we will respond within 30 days. You can also update
          your name and profile details on your account page.
        </p>

        <h2 id="cookies">Cookies and browser storage</h2>
        <p>
          We use one cookie, which is essential for the site to work, and a
          small amount of browser storage. We do not use advertising or tracking
          cookies.
        </p>
        <LegalTable>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Purpose</th>
                <th>Kept for</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>sunflower_session</td>
                <td>Essential cookie</td>
                <td>Keeps you signed in to your account</td>
                <td>30 days, or until you sign out</td>
              </tr>
              <tr>
                <td>gmw_lead_magnet_*</td>
                <td>Browser storage</td>
                <td>
                  Remembers whether you closed or completed the free-guide
                  form, so we don&apos;t keep showing it
                </td>
                <td>Until the end of your visit, or until you clear your browser</td>
              </tr>
            </tbody>
          </table>
        </LegalTable>
        <p>
          You can clear cookies and browser storage in your browser settings at
          any time. If you do, you&apos;ll need to sign in again.
        </p>

        <h2>Keeping it secure</h2>
        <p>
          We use encrypted connections (HTTPS), store passwords only in hashed
          form and limit who can access personal information. No system is
          completely secure, so please use a strong, unique password.
        </p>

        <h2>International transfers</h2>
        <p>
          Our service providers may store or process information outside your
          country. Where they do, we take steps to make sure it stays protected.
        </p>

        <h2>Children</h2>
        <p>
          {SITE_NAME} is not intended for anyone under 18, and we do not
          knowingly collect information from children.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. We will change the
          &quot;last updated&quot; date above and, for significant changes, let
          account holders know by email.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests: {email}
          <br />
          {company}, <LegalValue value={LEGAL.companyAddress} placeholder="registered address" />
        </p>
      </LegalPage>
    </>
  );
}
