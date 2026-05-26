import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — VibeSandbox',
};

const LAST_UPDATED = 'May 21, 2026';

export default function TosPage() {
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
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Last updated: {LAST_UPDATED}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="What VibeSandbox is">
            <P>VibeSandbox is a discovery marketplace for AI-powered apps. Builders list apps for sale; buyers browse and contact sellers directly. VibeSandbox facilitates the introduction only. We are not a broker, escrow service, or payment processor. All transactions occur off-platform between buyer and seller.</P>
          </Section>

          <Section title="Eligibility">
            <P>You must be at least 18 years old to use VibeSandbox. By creating an account, you confirm you have the legal authority to agree to these terms.</P>
          </Section>

          <Section title="Listing rules">
            <P>By submitting a listing you confirm that:</P>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'You own or have the right to sell the app.',
                'All information provided is accurate and not misleading.',
                'The app does not violate any laws or third-party rights.',
                'You are not listing an app on behalf of someone else without their consent.',
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>{item}</li>
              ))}
            </ul>
            <P>We may remove listings that violate these rules at any time without notice.</P>
          </Section>

          <Section title="AI scoring">
            <P>Every listing is evaluated automatically by an AI model (Google Gemini) across five dimensions: problem clarity, UX quality, monetization, market opportunity, and defensibility. Scores are generated from publicly available information about your app — the URL, description, and a screenshot.</P>
            <P>Scores are informational only. They are not financial advice, legal opinions, or guarantees of value. VibeSandbox is not responsible for decisions made based on AI scores or critiques.</P>
          </Section>

          <Section title="No payment processing">
            <P>VibeSandbox does not process, hold, or facilitate payments. When a buyer contacts a seller, VibeSandbox forwards the message once via email relay. All negotiation, due diligence, payment, and asset transfer happen directly between the parties. VibeSandbox has no involvement in and no liability for any transaction.</P>
          </Section>

          <Section title="Prohibited conduct">
            <P>You may not use VibeSandbox to:</P>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'List apps you do not own or have no right to sell.',
                'Submit false, misleading, or fraudulent information.',
                'Spam buyers or sellers through the contact relay.',
                'Scrape, crawl, or automate requests to the platform.',
                'Attempt to reverse-engineer or circumvent any security measures.',
                'Use the platform for any unlawful purpose.',
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title="Limitation of liability">
            <P>VibeSandbox is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the platform, any transaction between buyers and sellers, AI scoring results, or any third-party services we use.</P>
            <P>Our total liability to you for any claim is limited to the amount you paid us in the past 12 months, which for most users is $0.</P>
          </Section>

          <Section title="Termination">
            <P>We may suspend or terminate your account at any time for violations of these terms. You may delete your account at any time. Termination does not affect any obligations you have to buyers or sellers from prior interactions.</P>
          </Section>

          <Section title="Changes to these terms">
            <P>We may update these terms from time to time. We will update the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of VibeSandbox after changes are posted constitutes acceptance of the updated terms.</P>
          </Section>

          <Section title="Contact">
            <P>Questions: <a href="mailto:legal@vibesandbox.store" style={{ color: 'var(--blue)' }}>legal@vibesandbox.store</a></P>
          </Section>

        </div>
      </div>

      <footer style={{ borderTop: '2px solid var(--border2)', background: 'var(--bg2)', padding: 24 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>VibeSandbox</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/privacy" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Privacy</a>
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
