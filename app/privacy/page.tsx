import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — VibeSandbox',
};

const LAST_UPDATED = 'May 21, 2026';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.985 0.004 80 / 0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-new.png" alt="VibeSandbox" style={{ height: 40, width: 'auto', display: 'block' }} />
          </Link>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>·</span>
          <Link href="/feed" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>← Back to feed</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Last updated: {LAST_UPDATED}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="What we collect">
            <P>When you create an account, we store your email address and display name. If you sign in with Google, we receive your email address and name from Google — we do not store your Google password or any other Google account data.</P>
            <P>When you submit a listing, we store the title, URL, description, category, price, and any optional pitch or due diligence information you provide.</P>
            <P>When a buyer sends you an inquiry, we store a one-time relay token containing an encrypted version of the buyer&apos;s email address. The token expires after 24 hours.</P>
            <P>We do not use cookies beyond what is strictly necessary for authentication (Supabase session tokens).</P>
          </Section>

          <Section title="How we use it">
            <P>Your email address is used to authenticate your account and to forward buyer inquiries to you via our email relay. We do not send marketing emails.</P>
            <P>Listing content (title, URL, description, screenshot) is passed to Google&apos;s Gemini AI to generate an automated quality score and critique. This data is processed according to Google&apos;s API terms.</P>
            <P>Your app&apos;s public URL may be visited by microlink.io to capture a screenshot for your listing.</P>
          </Section>

          <Section title="What we share">
            <P>We do not sell your data. We do not share your personal information with third parties except as required to operate the service:</P>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Supabase — database and authentication hosting',
                'Google Gemini — AI scoring of listing content',
                'Resend — transactional email delivery',
                'microlink.io — screenshot capture of listed app URLs',
                'Vercel — hosting and CDN',
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title="Email relay">
            <P>When a buyer contacts a seller, their message is forwarded once to the seller&apos;s email address. The buyer&apos;s email is included in the relay so the seller can reply directly. After forwarding, we do not store the conversation. The relay token expires after 24 hours and cannot be used again.</P>
          </Section>

          <Section title="Data retention">
            <P>Your account and listings are retained until you delete them. You can delete a listing at any time from its detail page. To delete your account and all associated data, contact us at the email below.</P>
            <P>Relay tokens expire and are invalidated after 24 hours. Expired tokens are not deleted immediately but cannot be used to send further messages.</P>
          </Section>

          <Section title="Your rights">
            <P>You can request a copy of your data or ask us to delete it at any time by emailing us. We will respond within 30 days.</P>
          </Section>

          <Section title="Contact">
            <P>Questions about this policy: <a href="mailto:privacy@vibesandbox.store" style={{ color: 'var(--blue)' }}>privacy@vibesandbox.store</a></P>
          </Section>

        </div>
      </div>

      <footer style={{ borderTop: '2px solid var(--border2)', background: 'var(--bg2)', padding: 24 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>VibeSandbox</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/tos" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Terms</a>
            <a href="/feed" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Feed</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border2)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>{children}</p>;
}
