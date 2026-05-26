import Link from 'next/link';

export const metadata = {
  title: 'Deal Guide — VibeSandbox',
  description: 'What buyers and sellers need to verify after connecting. Ownership proof, due diligence checklist, red flags.',
};

const SELLER_CHECKLIST = [
  {
    title: 'Proving Ownership',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    icon: '🔑',
    items: [
      { label: 'Domain meta tag', desc: "If you have access to your app's <head>, this is the fastest proof. Drop a temporary verification meta tag at the buyer's request." },
      { label: 'App Store / Play Store developer name', desc: 'Show that the "Developer" field on your store page matches your name or company. Screenshots work.' },
      { label: 'GitHub repository', desc: 'Public repo: verify that commit author email matches your contact email. Private repo: invite the buyer as a collaborator temporarily.' },
      { label: 'Stripe / payment dashboard', desc: 'If you have revenue, a Stripe dashboard screenshot (sensitive fields masked) proves both income and account ownership at once.' },
    ],
  },
  {
    title: 'Prepare These in Advance',
    color: 'var(--green)',
    bg: 'var(--green-light)',
    icon: '📋',
    items: [
      { label: 'MAU / DAU', desc: 'Monthly and daily active users. An Analytics dashboard screenshot is enough — no need for raw exports.' },
      { label: 'MRR / total revenue', desc: 'Monthly recurring revenue or total revenue to date. Ranges are fine ($1k–$3k/mo). Buyers just need a ballpark.' },
      { label: 'Monthly operating costs', desc: 'API costs + hosting. Buyers need this to calculate profit after acquisition. Be specific.' },
      { label: 'Tech stack', desc: 'Which AI models, frameworks, and databases you use. Buyers use this to estimate how hard it will be to maintain.' },
      { label: 'Maintenance burden', desc: 'How much hands-on time it takes each month. "Set and forget" vs "needs daily attention" — be honest.' },
      { label: 'Reason for selling', desc: "The first thing every buyer asks. Prepare a clear, honest answer upfront — it builds trust faster than any metric." },
    ],
  },
  {
    title: 'Assets Included in the Sale',
    color: 'var(--amber)',
    bg: 'var(--amber-light)',
    icon: '📦',
    items: [
      { label: 'Domain', desc: 'Confirm whether domain transfer is included and which registrar (Namecheap, GoDaddy, etc.) it lives on.' },
      { label: 'GitHub repository', desc: 'Agree on transfer method upfront — ownership transfer, fork, or zip delivery. Ownership transfer is cleanest.' },
      { label: 'Social media accounts', desc: 'Twitter/X, LinkedIn pages, and follower equity. Note: personal accounts may not be transferable.' },
      { label: 'Customer database', desc: 'Check GDPR and privacy law requirements before transferring. Email list transfers may require explicit user consent.' },
      { label: 'Docs / SOPs', desc: 'Operating guides, prompt documentation, API key inventory. Often the most valuable asset after the code itself.' },
    ],
  },
];

const BUYER_CHECKLIST = [
  {
    q: 'Did you actually build this?',
    why: 'The most important question. Verify via domain access, App Store developer name, or GitHub commit history tied to their contact email.',
  },
  {
    q: 'Are there real users? How active are they?',
    why: 'Ask to see MAU, session count, and retention in an Analytics tool. Active users matter more than registered accounts.',
  },
  {
    q: 'How does it make money?',
    why: 'Understand MRR, payment method, and churn rate. "No revenue" is an honest answer — but if so, ask why people use it anyway.',
  },
  {
    q: 'What are the monthly operating costs?',
    why: 'AI API costs can spike fast with usage growth. Get the current cost breakdown and ask what happens when users 10x.',
  },
  {
    q: 'Which AI models does it depend on?',
    why: "Deep lock-in to a specific model is a risk if it gets deprecated or repriced. If there's fine-tuning, ask whether training data is transferable.",
  },
  {
    q: "Why are you selling?",
    why: "One of the most telling questions. Burnout, new project focus, need liquidity — make sure the reason makes sense and doesn't hint at a hidden problem.",
  },
  {
    q: 'What does handover look like?',
    why: 'Two-week transition minimum is standard. Understand the documentation level and whether the seller is reachable for urgent questions post-sale.',
  },
  {
    q: 'Are there any legal or compliance issues?',
    why: 'Check third-party API terms of service compliance, copyright, privacy policy, and data usage rules. AI apps often have data ingestion edge cases.',
  },
];

const RED_FLAGS = [
  { flag: 'Refuses or keeps delaying ownership verification', risk: 'HIGH' },
  { flag: 'Offers to show Analytics "later" or "after we agree on price"', risk: 'HIGH' },
  { flag: 'Claims revenue verbally with no screenshots or documentation', risk: 'HIGH' },
  { flag: 'No GitHub repo, or commit history is only a few days old', risk: 'HIGH' },
  { flag: "Doesn't know their monthly operating costs", risk: 'MED' },
  { flag: 'Claims no customer data exists but reports high MAU', risk: 'MED' },
  { flag: 'No documentation at all ("it\'s all in my head")', risk: 'MED' },
  { flag: 'Reason for selling keeps changing or stays vague', risk: 'MED' },
  { flag: 'Pushes for price agreement before sharing due diligence materials', risk: 'MED' },
];

const PROCESS_STEPS = [
  { n: '01', title: 'First message', desc: 'A buyer reaches out via the VibeSandbox relay. The message is forwarded to your email with the buyer\'s address included. Reply directly.' },
  { n: '02', title: 'Basic verification', desc: 'Share ownership proof and key metrics (MAU, MRR, operating costs). Trust needs to be established here before moving forward.' },
  { n: '03', title: 'Due diligence', desc: 'Tech stack review, Analytics access, code inspection, customer data scope, legal issues. Use the buyer checklist below.' },
  { n: '04', title: 'Price negotiation', desc: "VibeSandbox doesn't get involved in pricing. Common frameworks: SDE (Seller's Discretionary Earnings) or MRR multiple (typically 12–36x)." },
  { n: '05', title: 'Asset transfer', desc: 'Transfer domain, code, accounts, and documentation in sequence. Confirm payment before transferring, or use an escrow service (Escrow.com).' },
  { n: '06', title: 'Handover', desc: 'A two-week minimum handover period is strongly recommended. Put seller availability for post-sale questions in writing.' },
];

export default function DealGuidePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.985 0.004 80 / 0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-new.png" alt="VibeSandbox" style={{ height: 40, width: 'auto', display: 'block' }} />
          </Link>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>·</span>
          <Link href="/feed" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>← Back to feed</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 4, background: 'var(--accent)', border: '2px solid var(--ink)', boxShadow: '2px 2px 0px var(--ink)', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Connected?</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
            Here&apos;s what to verify next
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text2)', lineHeight: 1.7 }}>
            VibeSandbox makes the introduction — the deal is yours to close.
            Here&apos;s what both sides need to check before any money changes hands.
          </p>
        </div>

        {/* Process */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 28 }}>The process</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PROCESS_STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20 }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, background: 'var(--ink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: 'var(--accent)', fontFamily: "'DM Mono', monospace",
                  }}>{s.n}</div>
                  {i < PROCESS_STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 6, minHeight: 28 }} />
                  )}
                </div>
                <div style={{ paddingTop: 8, paddingBottom: i < PROCESS_STEPS.length - 1 ? 28 : 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seller section */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--ink)', color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>SELLER</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>What buyers will ask</h2>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 32 }}>
            Buyers will ask for all of this. Having it ready speeds up the process and signals you&apos;re serious.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {SELLER_CHECKLIST.map((section, si) => (
              <div key={si} style={{ border: '2px solid var(--ink)', borderRadius: 8, overflow: 'hidden', boxShadow: '3px 3px 0px var(--ink)' }}>
                <div style={{ padding: '14px 20px', background: section.bg, borderBottom: '2px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{section.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: section.color }}>{section.title}</span>
                </div>
                <div style={{ background: '#fff' }}>
                  {section.items.map((item, ii) => (
                    <div key={ii} style={{ padding: '14px 20px', borderBottom: ii < section.items.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 14 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: section.color, flexShrink: 0, marginTop: 7 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer section */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--blue)', color: '#fff', fontFamily: "'DM Mono', monospace" }}>BUYER</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Questions to ask</h2>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28 }}>
            Don&apos;t open with price. Work through these in order and build trust first.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid var(--ink)', borderRadius: 8, overflow: 'hidden', boxShadow: '3px 3px 0px var(--ink)', background: '#fff' }}>
            {BUYER_CHECKLIST.map((item, i) => (
              <div key={i} style={{ padding: '16px 20px', borderBottom: i < BUYER_CHECKLIST.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text3)', paddingTop: 2, flexShrink: 0 }}>Q{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.q}</div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{item.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Red flags */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Red flags</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
            If you see any of these, slow down and reconsider before going further.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RED_FLAGS.map((rf, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 6, background: '#fff',
                border: `2px solid ${rf.risk === 'HIGH' ? 'var(--red)' : 'var(--border)'}`,
                boxShadow: rf.risk === 'HIGH' ? '2px 2px 0px var(--red)' : '2px 2px 0px var(--border2)',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                  fontFamily: "'DM Mono', monospace",
                  background: rf.risk === 'HIGH' ? 'var(--red)' : 'var(--amber)',
                  color: '#fff',
                }}>{rf.risk}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{rf.flag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '20px 24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 48 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
            <strong>VibeSandbox is not a party to any transaction.</strong> We provide discovery and the first introduction only. Deal terms, asset transfer, and payment are entirely between seller and buyer. Consult a lawyer or M&A broker for high-value deals.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 32px', background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, boxShadow: '4px 4px 0px var(--ink)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Not connected yet?</div>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 24 }}>
            Browse AI apps sorted by score. Find something worth buying.
          </p>
          <Link href="/feed" style={{
            display: 'inline-block', padding: '11px 28px',
            background: 'var(--ink)', color: 'var(--accent)',
            borderRadius: 4, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '2px 2px 0px var(--accent-dark)',
          }}>
            Browse the feed →
          </Link>
        </div>

      </div>

      <footer style={{ borderTop: '2px solid var(--border2)', background: 'var(--bg2)', padding: 24 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>VibeSandbox</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/feedback" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Feedback</a>
            <a href="/feed" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Feed</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
