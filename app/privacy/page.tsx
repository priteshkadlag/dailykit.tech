import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Ban, Cookie, HardDrive, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnalyticsChoice } from "@/components/privacy/analytics-choice";

export const metadata: Metadata = pageMetadata("/privacy", {
  title: "Privacy Policy – Your Files Stay on Your Device",
  description: `How ${siteConfig.name} handles your data: tools run in your browser, files are never uploaded, and you control statistics and ad personalisation.`,
});

const UPDATED = "1 October 2026";

const highlights = [
  { icon: HardDrive, title: "Your files stay on your device", text: "PDF, image, QR, text and calculator tools work inside your browser. We never receive your files or inputs." },
  { icon: Ban, title: "We never sell your data", text: "Your files and what you type are never shared with anyone — including advertisers or data brokers." },
  { icon: Cookie, title: "Ads keep the tools free", text: "Google ads support the free tools. Pro accounts see no ads at all." },
  { icon: ShieldCheck, title: "One switch, your choice", text: "Turn off statistics and personalised ads below. Your inputs and files are never included either way." },
];

const sections = [
  ["who-we-are", "Who we are"],
  ["on-device", "Tools that run on your device"],
  ["online-tools", "Tools that connect to the internet"],
  ["browser-storage", "What we keep in your browser"],
  ["statistics", "Usage statistics and Google Analytics"],
  ["advertising", "Advertising (Google AdSense)"],
  ["server", "Server logs and abuse protection"],
  ["accounts", "Accounts"],
  ["cookies", "Cookies"],
  ["sharing", "Who we share data with"],
  ["retention", "How long we keep data"],
  ["rights", "Your choices and rights"],
  ["children", "Children"],
  ["security", "Security"],
  ["changes", "Changes to this policy"],
  ["contact", "Contact and grievances"],
] as const;

const onlineTools = [
  ["OCR PDF (make scanned PDFs searchable)", "The first time you use it, your browser downloads the open-source Tesseract text recogniser and language data from the jsDelivr CDN.", "Your PDF is read on your device. jsDelivr sees a normal download request (your IP address and browser)."],
  ["Speech to Text", "Uses your browser's built-in speech recognition.", "Chrome and Edge send the audio to Google or Microsoft to transcribe it; Safari may use Apple. We never receive your audio or text."],
  ["DNS Lookup and Email Validator (MX check)", "Your browser asks Cloudflare's public DNS-over-HTTPS service (cloudflare-dns.com) about the domain.", "Only the domain name you typed is sent, under Cloudflare's resolver privacy policy."],
  ["API Request Tester", "Your browser sends the request you build straight to the URL you enter.", "That website receives the request, headers and body you entered. It doesn't pass through our servers."],
  ["HTTP Status Checker (live URL check)", "Our server visits the URL you enter and reads only the status code and headers.", "The URL is used for that one check and is not stored. Private and internal addresses are blocked."],
  ["IP Address Checker", "Our server reads the public IP address your request comes from and shows it to you.", "It isn't stored by this tool."],
  ["WhatsApp links and share buttons", "Nothing is sent until you click. Then WhatsApp (or the app you share to) opens.", "That app's own privacy policy applies to what you send there."],
  ["QR code scanner (camera)", "Your browser asks permission before using the camera.", "The camera image is decoded on your device and never uploaded. You can revoke access in your browser at any time."],
] as const;

const storageRows = [
  ["Invoices, quotations, expenses, tasks, favourites and saved calculations", "So your work is still there next time — without an account."],
  ["Unsaved drafts (for example a half-filled invoice or the Markdown editor)", "So you don't lose work if the page reloads."],
  ["Recently opened tools in the search popup", "To show them at the top when you search again. Use “Clear” in the popup to remove them."],
  ["A random visitor ID (dailykit:visitor)", "To count anonymous usage statistics — see below."],
  ["Your statistics choice (dailykit:analytics-opt-out)", "To remember that you switched statistics off."],
] as const;

export default function PrivacyPage() {
  const email = siteConfig.supportEmail;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Privacy", href: "/privacy" }]} />

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold text-primary">Last updated {UPDATED}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Privacy policy</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          {siteConfig.name} is built to need as little of your data as possible. This page explains, tool by tool, what stays on your device, what goes online, and the
          choices you have.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand"><Icon className="size-5" aria-hidden /></span>
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="On this page" className="self-start rounded-2xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-36">
          <p className="text-sm font-semibold">On this page</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
            {sections.map(([id, label]) => <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-primary">{label}</a></li>)}
          </ol>
        </nav>

        <div className="prose-section min-w-0 max-w-3xl space-y-4 leading-relaxed [&_h2]:scroll-mt-36 [&_h2]:pt-4 [&_p_a]:font-medium [&_p_a]:text-primary [&_p_a]:hover:underline">
          <h2 id="who-we-are">1. Who we are</h2>
          <p>
            {siteConfig.name} ({siteConfig.url.replace(/^https?:\/\//, "")}) is a free collection of calculators, PDF and image tools, language keyboards, font converters,
            business and developer utilities, plus a blog. In this policy, “we” means the team that runs {siteConfig.name}. You can reach us at{" "}
            <a href={`mailto:${email}`}>{email}</a>.
          </p>

          <h2 id="on-device">2. Tools that run on your device</h2>
          <p>
            Almost every tool runs entirely inside your web browser. When you pick a file or type into a tool, the work happens on your phone or computer. Your files and
            inputs are <strong>not uploaded to us</strong>, and we can&apos;t see them. This includes:
          </p>
          <ul>
            <li>all calculators (GST, EMI, income tax, SIP, HRA, age, percentage and the rest);</li>
            <li>PDF tools (merge, split, compress, convert, sign, edit, protect and unlock);</li>
            <li>image tools (resize, compress, crop, convert) and the QR code generator;</li>
            <li>password and text tools, language keyboards and font converters;</li>
            <li>developer tools such as JSON, XML, Base64, regex and hash tools;</li>
            <li>invoice, quotation and document generators — the PDF is created on your device.</li>
          </ul>
          <p>Once a page has loaded, these tools keep working even if your connection drops.</p>

          <h2 id="online-tools">3. Tools that connect to the internet</h2>
          <p>A few tools can only do their job by contacting another service. Each one does so only when you use it:</p>
          <div className="not-prose overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr><th scope="col" className="px-4 py-3 font-semibold">Tool</th><th scope="col" className="px-4 py-3 font-semibold">What happens</th><th scope="col" className="px-4 py-3 font-semibold">What is shared</th></tr>
              </thead>
              <tbody className="divide-y bg-card">
                {onlineTools.map(([tool, what, shared]) => (
                  <tr key={tool} className="align-top"><th scope="row" className="px-4 py-3 font-medium text-foreground">{tool}</th><td className="px-4 py-3 text-muted-foreground">{what}</td><td className="px-4 py-3 text-muted-foreground">{shared}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 id="browser-storage">4. What we keep in your browser</h2>
          <p>
            Some tools remember things using your browser&apos;s local storage. This stays on your device; we can&apos;t read it. Clearing your browser&apos;s site data for{" "}
            {siteConfig.name} removes all of it.
          </p>
          <div className="not-prose overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-lg text-left text-sm">
              <thead className="bg-muted text-foreground"><tr><th scope="col" className="px-4 py-3 font-semibold">What</th><th scope="col" className="px-4 py-3 font-semibold">Why</th></tr></thead>
              <tbody className="divide-y bg-card">
                {storageRows.map(([what, why]) => <tr key={what} className="align-top"><td className="px-4 py-3 font-medium text-foreground">{what}</td><td className="px-4 py-3 text-muted-foreground">{why}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p>Anything you save this way exists only in that browser on that device. If you clear it, or use another device, it&apos;s gone — so download important invoices as PDF.</p>

          <h2 id="statistics">5. Usage statistics and Google Analytics</h2>
          <p>To learn which tools are useful and what to improve, we use two kinds of statistics.</p>
          <p>
            <strong>Our own tool counts.</strong> We record simple events such as “GST calculator opened”, “calculation completed” or “PDF downloaded”. Each event contains
            only the event name, the tool, a random ID created in your browser (not linked to your name, email or account) and the time.
          </p>
          <p>
            <strong>Google Analytics, through Google Tag Manager.</strong> These Google services measure visits: which pages are viewed, how people arrive (for example from a
            search engine), and general information such as device type, browser, approximate location (country or city, derived from your IP address) and how long a
            visit lasts. Google Analytics sets cookies (such as <code>_ga</code>) to recognise a returning browser. Google processes this data under its own{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>; see also{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">how Google uses data from sites that use its services</a>.
            We don&apos;t use Google Analytics for advertising.
          </p>
          <p>
            Neither kind <strong>ever</strong> includes what you typed, your files, results, names, phone numbers or amounts — those stay on your device. Neither runs if your
            browser sends Do Not Track or Global Privacy Control. One switch turns both off for this browser and also limits ads to non-personalised ones (see{" "}
            <a href="#advertising">section 6</a>). Changes apply from your next page view:
          </p>
          <AnalyticsChoice />

          <h2 id="advertising">6. Advertising (Google AdSense)</h2>
          <p>
            To keep the tools free, {siteConfig.name} shows ads served by Google AdSense. Accounts on the Pro plan see no ads. Ads never receive your files, what you type
            into a tool, or your results — those stay on your device.
          </p>
          <ul>
            <li>
              Google and its partners use cookies (such as <code>__gads</code>, <code>__gpi</code> and <code>IDE</code>) or similar technologies to serve ads, limit how often
              you see the same ad, measure ad performance and prevent fraud.
            </li>
            <li>
              Third-party vendors, including Google, may use these cookies to show you ads based on your previous visits to this and other websites (“personalised ads”).
              Google&apos;s advertising cookies let it and its partners serve ads based on your visits here and elsewhere on the internet.
            </li>
            <li>
              You can opt out of personalised advertising in Google&apos;s{" "}
              <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">My Ad Center</a>, and from many other ad companies at{" "}
              <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">aboutads.info</a>. On this site, switching statistics off in section 5 (or a
              browser sending Do Not Track or Global Privacy Control) also means you only get non-personalised ads, which use cookies only for frequency capping,
              measurement and fraud prevention.
            </li>
            <li>
              Visitors in the European Economic Area, the UK and Switzerland are asked for consent through Google&apos;s consent message before personalised ads are shown.
            </li>
          </ul>
          <p>
            Learn more in{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">how Google uses cookies in advertising</a> and{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">how Google uses information from sites that use its services</a>.
          </p>

          <h2 id="server">7. Server logs and abuse protection</h2>
          <p>
            Like every website, our hosting provider receives technical information when your browser loads a page — your IP address, browser type, the page requested and
            the time. This is used to deliver the site, keep it secure and fix errors, and is not used to profile you.
          </p>
          <p>
            To stop abuse (such as password guessing or flooding a tool), we count requests per visitor for a short time. These counters store a scrambled one-way hash of
            the IP address or email, never the address itself, and they reset within an hour.
          </p>

          <h2 id="accounts">8. Accounts</h2>
          <p>
            Public sign-up is currently closed and you don&apos;t need an account to use any tool. For accounts that already exist (for example our editors), we store:
          </p>
          <ul>
            <li>name, email address and a securely hashed password — or your Google account ID if you sign in with Google;</li>
            <li>items you choose to save to the account: invoices, quotations, expenses, tasks, business profile, saved calculations and favourite tools;</li>
            <li>which days you were active (to count active users), and your settings such as the statistics choice;</li>
            <li>for password resets, a one-time link sent to your email that expires after 60 minutes.</li>
          </ul>
          <p>Saved items are tied to your account, so only you can see them. You can ask us to delete your account and everything in it at any time.</p>

          <h2 id="cookies">9. Cookies</h2>
          <p>We use three kinds of cookies:</p>
          <ul>
            <li>
              <strong>Essential cookies</strong> keep a signed-in account signed in (for up to 30 days) and protect the login form. If you never sign in, you don&apos;t
              need them.
            </li>
            <li>
              <strong>Statistics cookies</strong> from Google Analytics (such as <code>_ga</code> and <code>_ga_*</code>, kept for up to 2 years) recognise a returning
              browser so visits can be counted. They are not set if you switch statistics off in <a href="#statistics">section 5</a> or your browser sends Do Not Track or
              Global Privacy Control. You can also delete them in your browser settings at any time.
            </li>
            <li>
              <strong>Advertising cookies</strong> from Google AdSense and its partners (such as <code>__gads</code>, <code>__gpi</code> and <code>IDE</code>, typically kept
              for up to 13 months) serve and measure ads, as described in <a href="#advertising">section 6</a>. They aren&apos;t used for Pro accounts, and are limited to
              non-personalised ads if you switch statistics off.
            </li>
          </ul>

          <h2 id="sharing">10. Who we share data with</h2>
          <p>We do not sell, rent or trade personal data for money. We share data only:</p>
          <ul>
            <li><strong>with service providers</strong> that run the site for us — website hosting, our database and our email service (for password-reset emails) — who may only use it to provide that service;</li>
            <li><strong>with Google</strong>, for the visit statistics described in section 5 (unless you switch them off) and the ads described in section 6;</li>
            <li><strong>with the services listed in section 3</strong>, and only when you use those tools;</li>
            <li><strong>when the law requires it</strong>, for example a valid request from a court or government authority, or to protect the safety of our users and the site.</li>
          </ul>

          <h2 id="retention">11. How long we keep data</h2>
          <ul>
            <li><strong>Browser storage:</strong> until you delete it or clear your browser&apos;s site data.</li>
            <li><strong>Account data:</strong> until you delete the item, or until you ask us to delete the account.</li>
            <li><strong>Our own tool counts:</strong> kept only as long as they are useful for understanding which tools people use. They can&apos;t identify you.</li>
            <li><strong>Google Analytics:</strong> kept by Google for the retention period set in our Analytics account (Google&apos;s default is 2 months, up to 14 months).</li>
            <li><strong>Advertising data:</strong> kept by Google under its own policies; advertising cookies typically expire after up to 13 months.</li>
            <li><strong>Abuse-protection counters:</strong> reset within an hour. <strong>Password-reset links:</strong> 60 minutes.</li>
          </ul>

          <h2 id="rights">12. Your choices and rights</h2>
          <p>
            You can use every tool without giving us any personal information. Under India&apos;s Digital Personal Data Protection Act, 2023 and similar laws, you can ask
            us to:
          </p>
          <ul>
            <li>tell you what personal data we hold about you;</li>
            <li>correct or update it;</li>
            <li>delete it, including your whole account;</li>
            <li>withdraw consent you gave earlier, such as switching statistics off.</li>
          </ul>
          <p>
            Email <a href={`mailto:${email}`}>{email}</a> from the address linked to your account. We may need to confirm it&apos;s you, and we&apos;ll reply as quickly as
            we can, within 30 days at the latest.
          </p>

          <h2 id="children">13. Children</h2>
          <p>
            The tools are safe for anyone to use without an account. Accounts are not meant for children under 18, and we don&apos;t knowingly collect their personal data. If
            you think a child has given us personal data, email us and we&apos;ll delete it.
          </p>

          <h2 id="security">14. Security</h2>
          <p>
            The site is served over encrypted HTTPS. Passwords are hashed with bcrypt and never stored in readable form. Login attempts are rate-limited, signing out
            everywhere ends all sessions, and every saved record is checked against its owner before it&apos;s shown. Raw HTML in blog posts is blocked to prevent harmful
            scripts. No system is perfectly secure, but we work to protect what little data we hold.
          </p>

          <h2 id="changes">15. Changes to this policy</h2>
          <p>
            If we change how we handle data, we&apos;ll update this page and the “Last updated” date at the top. For significant changes, such as a new kind of data we collect,
            we&apos;ll make it clearly visible on the site before it applies.
          </p>

          <h2 id="contact">16. Contact and grievances</h2>
          <p>Questions, requests or complaints about privacy — including grievances under the DPDP Act — can be sent to:</p>
          <div className="not-prose flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-primary/20 sm:flex-row sm:items-center">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand"><Mail className="size-5" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted-foreground">Privacy contact</span>
              <a href={`mailto:${email}?subject=${encodeURIComponent("Privacy request")}`} className="block text-lg font-semibold break-all text-foreground hover:text-primary">{email}</a>
            </span>
            <a href={`mailto:${email}?subject=${encodeURIComponent("Delete my data")}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold hover:bg-accent">
              <Trash2 className="size-4" aria-hidden /> Request deletion
            </a>
          </div>
          <p>
            For anything else, see the <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
