import Link from 'next/link';

export const metadata = {
  title: 'How it works — VibeSandbox',
  description: 'VibeSandbox is an AI-scored marketplace for AI-powered apps. Builders sell, buyers discover.',
};

const STEPS = [
  {
    number: '01',
    title: 'Submit your app',
    description: 'Sign up and list your AI-powered app with a title, URL, description, and price. Free to list. Takes under 2 minutes.',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
  },
  {
    number: '02',
    title: 'AI scores it automatically',
    description: 'Our AI fetches your app\'s metadata, takes a screenshot, and scores it across 5 dimensions — problem clarity, UX quality, monetization, market opportunity, and defensibility. Score arrives within 5 minutes.',
    color: 'var(--amber)',
    bg: 'var(--amber-light)',
  },
  {
    number: '03',
    title: 'Buyers discover you',
    description: 'Your listing appears in the public feed, sorted by AI score. Buyers browse, filter by category and price, and read the AI critique to decide if your app fits their needs.',
    color: 'var(--green)',
    bg: 'var(--green-light)',
    categories: ['Productivity', 'Writing', 'Code', 'Design', 'Research', 'Health', 'Education', 'Finance', 'Marketing', 'Social', 'Other'],
  },
  {
    number: '04',
    title: 'Connect directly, no middleman',
    description: 'Interested buyers send you a message through our encrypted relay. You get their email directly — so you can reply and close the deal off-platform. No fees, no payment processing.',
    color: 'oklch(0.62 0.16 300)',
    bg: 'oklch(0.95 0.04 300)',
  },
];

const DIMENSIONS = [
  {
    label: 'Problem Clarity', weight: '25%',
    desc: 'Does it solve a specific, real problem for a clear audience?',
    color: 'var(--blue)',
    tiers: [
      { range: '0–3', label: 'Vague', text: 'Me-too problem with no clear audience' },
      { range: '4–6', label: 'Specific', text: 'Real problem, but fuzzy on who suffers' },
      { range: '7–10', label: 'Nailed it', text: 'One sentence that names who suffers and why' },
    ],
  },
  {
    label: 'UX Quality', weight: '20%',
    desc: 'Can someone understand what it does in 10 seconds and try it with zero friction?',
    color: 'var(--green)',
    tiers: [
      { range: '0–3', label: 'Confusing', text: "Can't figure out what it does in 30 seconds" },
      { range: '4–6', label: 'Workable', text: 'Understandable but clunky to get started' },
      { range: '7–10', label: 'Frictionless', text: 'Clear in 10s, instant path to value' },
    ],
  },
  {
    label: 'Monetization', weight: '20%',
    desc: 'Is there a clear revenue model and a proven or obvious path to cashflow?',
    color: 'var(--amber)',
    tiers: [
      { range: '0–3', label: 'None', text: 'No pricing, no revenue path visible' },
      { range: '4–6', label: 'Unclear', text: 'Some monetization but model is ambiguous' },
      { range: '7–10', label: 'Clear', text: 'Visible pricing, proven or obvious path to cashflow' },
    ],
  },
  {
    label: 'Market Opportunity', weight: '20%',
    desc: 'Is the addressable market large or growing enough to be worth acquiring?',
    color: 'oklch(0.52 0.19 22)',
    tiers: [
      { range: '0–3', label: 'Tiny', text: 'Niche or shrinking market' },
      { range: '4–6', label: 'Real', text: 'Solid market but crowded with no clear wedge' },
      { range: '7–10', label: 'Large', text: 'Large or fast-growing market with room to capture share' },
    ],
  },
  {
    label: 'Defensibility', weight: '15%',
    desc: 'Does it have a moat — proprietary data, switching costs, or unique distribution?',
    color: 'oklch(0.52 0.19 300)',
    tiers: [
      { range: '0–3', label: 'None', text: 'Trivial to replicate in a weekend' },
      { range: '4–6', label: 'Weak', text: 'Some moat but copyable with resources' },
      { range: '7–10', label: 'Strong', text: 'Proprietary data, switching costs, or unique distribution' },
    ],
  },
];

const CALIBRATION = [
  {
    score: 38,
    label: 'Low',
    color: 'var(--red)',
    bg: 'var(--red-light)',
    example: '"Chat with your documents" — generic problem, no pricing, crowded market, trivial to replicate.',
    breakdown: { 'Problem': 4, 'UX': 3, 'Revenue': 2, 'Market': 4, 'Moat': 3 },
  },
  {
    score: 62,
    label: 'Mid',
    color: 'var(--amber)',
    bg: 'var(--amber-light)',
    example: 'Standup bot pulling from Jira/GitHub. Clear SaaS pricing, solid market, but easily copied.',
    breakdown: { 'Problem': 7, 'UX': 6, 'Revenue': 6, 'Market': 7, 'Moat': 5 },
  },
  {
    score: 84,
    label: 'High',
    color: 'var(--green)',
    bg: 'var(--green-light)',
    example: 'Email assistant trained on your writing style. $49/mo pricing, data moat that grows over time.',
    breakdown: { 'Problem': 9, 'UX': 8, 'Revenue': 8, 'Market': 7, 'Moat': 8 },
  },
];

const FAQS = [
  {
    q: 'How much does it cost to list?',
    a: 'Free. There are no listing fees and no commission. VibeSandbox facilitates the introduction — the deal happens between you and the buyer.',
  },
  {
    q: 'Who can see my listing?',
    a: 'Everyone. The feed is fully public — no account needed to browse. This means your listing gets maximum exposure from day one.',
  },
  {
    q: 'What if my score feels wrong?',
    a: 'Scores are based on what the AI can evaluate from your URL, metadata, and description. A strong pitch with clear pricing and a well-defined target market improves your Monetization and Market Opportunity scores significantly.',
  },
  {
    q: 'How does the email relay work?',
    a: "Buyer messages are forwarded once to your email address. The buyer's email is included so you can reply directly. We never store conversations and the relay token expires after 24 hours.",
  },
  {
    q: 'Can I edit my listing after submitting?',
    a: 'Yes. You can edit the title, description, category, and price at any time from your listing page.',
  },
  {
    q: 'How many apps can I list?',
    a: 'Up to 3 per week. This keeps the feed high-quality and prevents spam.',
  },
];

export default function HowItWorksPage() {
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
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
            How VibeSandbox works
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.7 }}>
            A marketplace where every AI app is scored by AI — not by follower count or marketing budget.
            Builders list, AI judges, buyers discover.
          </p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 72 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, marginBottom: i < STEPS.length - 1 ? 40 : 0 }}>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: step.bg, border: `2px solid ${step.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: step.color, fontFamily: "'DM Mono', monospace",
                }}>
                  {step.number}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 8, minHeight: 32 }} />
                )}
              </div>
              <div style={{ paddingTop: 10, paddingBottom: i < STEPS.length - 1 ? 32 : 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{step.title}</div>
                <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 'categories' in step ? 14 : 0 }}>{step.description}</p>
                {'categories' in step && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(step as typeof step & { categories: string[] }).categories.map(c => (
                      <span key={c} style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                        border: '2px solid var(--ink)', background: 'var(--bg)',
                        color: 'var(--text)', fontFamily: "'DM Mono', monospace",
                      }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scoring rubric */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>The scoring rubric</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 32 }}>
            Every listing is evaluated by AI across 5 dimensions. Final score (0–100) = weighted average × 10.
            Most apps land between 40–75. 80+ is rare — calibrated hard to keep the bar meaningful.
          </p>

          {/* Dimension cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
            {DIMENSIONS.map((d, i) => (
              <div key={i} style={{
                background: '#fff', border: '2px solid var(--ink)', borderRadius: 8,
                boxShadow: '3px 3px 0px var(--ink)', overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 4,
                    background: d.color, color: '#fff', fontFamily: "'DM Mono', monospace",
                  }}>{d.weight}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{d.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 4 }}>{d.desc}</span>
                </div>
                {/* Tiers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                  {d.tiers.map((t, ti) => (
                    <div key={ti} style={{
                      padding: '12px 16px',
                      borderRight: ti < 2 ? '1px solid var(--border)' : 'none',
                      background: ti === 2 ? 'oklch(0.97 0.01 128)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text3)' }}>{t.range}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ti === 0 ? 'var(--red)' : ti === 1 ? 'var(--amber)' : 'var(--green)' }}>{t.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, margin: 0 }}>{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Calibration examples */}
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.01em' }}>Calibration examples</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CALIBRATION.map((c, i) => (
              <div key={i} style={{
                padding: '16px 20px', background: '#fff', border: '2px solid var(--ink)',
                borderRadius: 8, boxShadow: '2px 2px 0px var(--ink)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace",
                    color: c.color, letterSpacing: '-0.03em',
                  }}>{c.score}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>/100</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: c.bg, color: c.color }}>{c.label}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{c.example}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(c.breakdown).map(([k, v]) => (
                    <span key={k} style={{
                      fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                      padding: '2px 8px', borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)',
                    }}>{k} {v}/10</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 28 }}>FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                padding: '20px 0',
                borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{faq.q}</div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 32px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Ready to list your app?</div>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 24 }}>
            Free to submit. AI score in under 5 minutes.
          </p>
          <Link href="/feed" style={{
            display: 'inline-block', padding: '12px 28px', background: 'var(--blue)', color: '#fff',
            borderRadius: 9, fontSize: 15, fontWeight: 600, textDecoration: 'none',
          }}>
            Browse the feed →
          </Link>
        </div>

      </div>

      <footer style={{ borderTop: '2px solid var(--border2)', background: 'var(--bg2)', padding: 24 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>VibeSandbox</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/deal-guide" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Deal guide</a>
            <a href="/feedback" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Feedback</a>
            <a href="/feed" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Feed</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
