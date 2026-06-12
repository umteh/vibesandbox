'use client';

import { useState, useEffect, useRef } from 'react';

const PLACEHOLDERS = [
  'yourapp.com',
  'apps.apple.com/app/your-app/id123456789',
  'play.google.com/store/apps/details?id=com.yourapp',
];

function useTypewriter() {
  const [display, setDisplay] = useState('');
  const [label, setLabel]     = useState('Website');
  const labels = ['Website', 'App Store', 'Play Store'];
  const idx    = useRef(0);
  const pos    = useRef(0);
  const dir    = useRef<'typing' | 'deleting'>('typing');
  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const MAX = 15;
    function tick() {
      const phrase = PLACEHOLDERS[idx.current];
      const cap = Math.min(phrase.length, MAX);
      if (dir.current === 'typing') {
        pos.current += 1;
        const text = phrase.slice(0, pos.current);
        setDisplay(phrase.length > MAX && pos.current >= MAX ? text + '…' : text);
        setLabel(labels[idx.current]);
        if (pos.current >= cap) {
          dir.current = 'deleting';
          timer.current = setTimeout(tick, 1800);
        } else {
          timer.current = setTimeout(tick, 55);
        }
      } else {
        pos.current -= 1;
        const text = phrase.slice(0, pos.current);
        setDisplay(phrase.length > MAX && pos.current >= MAX ? text + '…' : text);
        if (pos.current === 0) {
          idx.current  = (idx.current + 1) % PLACEHOLDERS.length;
          dir.current  = 'typing';
          timer.current = setTimeout(tick, 400);
        } else {
          timer.current = setTimeout(tick, 28);
        }
      }
    }
    timer.current = setTimeout(tick, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { display, label };
}

type Platform = 'web' | 'ios' | 'android' | 'cross-platform';
type BandState = 'idle' | 'loading' | 'result' | 'error';
type Confidence = 'low' | 'medium' | 'high';

interface EstimateResult {
  low: number;
  high: number;
  rationale: string[];
  confidence: Confidence;
}

interface Props {
  onListThisApp: (url: string) => void;
}

function detectPlatform(url: string): Platform {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const host = new URL(normalized).hostname.toLowerCase();
    if (host.includes('apps.apple.com') || host.includes('testflight.apple.com')) return 'ios';
    if (host.includes('play.google.com')) return 'android';
  } catch { /* fall through to web */ }
  return 'web';
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `$${n.toLocaleString()}`;
}

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: 'Rough estimate',
  medium: 'Good estimate',
  high: 'Strong estimate',
};

export default function ValuationBand({ onListThisApp }: Props) {
  const { display: typedPlaceholder, label: placeholderLabel } = useTypewriter();
  const [url, setUrl] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [visitors, setVisitors] = useState('');
  const [mrr, setMrr] = useState('');
  const [state, setState] = useState<BandState>('idle');
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  function handleUrlBlur() {
    if (url.trim().length > 0 && url.includes('.')) {
      setShowOptional(true);
    }
  }

  async function estimate() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setState('loading');
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          platform: detectPlatform(trimmedUrl),
          monthly_visitors: visitors ? parseInt(visitors.replace(/[^0-9]/g, ''), 10) : undefined,
          mrr: mrr ? parseInt(mrr.replace(/[^0-9]/g, ''), 10) : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setState('error');
        setErrorMsg('Rate limit reached — 5 estimates per hour. Try again later.');
        return;
      }
      if (res.status === 422) {
        setState('error');
        setErrorMsg("Hmm, we couldn't pull data from that link. Is the URL correct?");
        return;
      }
      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error ?? 'Something went wrong. Try again.');
        return;
      }

      setResult(data as EstimateResult);
      setState('result');
    } catch {
      setState('error');
      setErrorMsg('Network error. Check your connection and try again.');
    }
  }

  function reset() {
    setState('idle');
    setResult(null);
    setErrorMsg('');
    setUrl('');
    setVisitors('');
    setMrr('');
    setShowOptional(false);
  }

  return (
    <div style={{
      borderBottom: '2px solid var(--border2)',
      background: 'var(--bg)',
      padding: '28px 24px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            What&apos;s your app worth?
          </span>
        </div>

        {state === 'result' && result ? (
          /* ── Result state ── */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                {formatCurrency(result.low)} – {formatCurrency(result.high)}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                border: '2px solid var(--ink)', color: 'var(--ink)',
                boxShadow: '2px 2px 0px var(--ink)',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {CONFIDENCE_LABELS[result.confidence]}
              </span>
            </div>

            <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.rationale.map((r, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--ink)', flexShrink: 0 }}>→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => onListThisApp(url.trim())}
                style={{
                  padding: '10px 20px', background: 'var(--ink)', color: 'var(--accent)',
                  border: '2px solid var(--ink)', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', letterSpacing: '0.02em', whiteSpace: 'nowrap',
                  boxShadow: '3px 3px 0px var(--border2)',
                }}
              >
                List this app →
              </button>
              <button
                onClick={reset}
                style={{
                  padding: '10px 16px', background: 'transparent', color: 'var(--text3)',
                  border: '2px solid var(--border2)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try another URL
              </button>
            </div>
          </div>

        ) : state === 'loading' ? (
          /* ── Loading state ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 16, height: 16, border: '2px solid var(--border2)',
              borderTopColor: 'var(--ink)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              Analyzing your app… (up to 15s for mobile apps)
            </span>
          </div>

        ) : (
          /* ── Idle / Error state ── */
          <div>
            <div className="vb-row">
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder=""
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => { setInputFocused(false); handleUrlBlur(); }}
                  onKeyDown={e => e.key === 'Enter' && estimate()}
                  className="vb-input"
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '2px solid var(--ink)',
                    borderRadius: 0, fontSize: 13,
                    outline: 'none', background: '#fff',
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                  }}
                />
                {!url && !inputFocused && (
                  <div style={{
                    position: 'absolute', left: 14, right: 0, top: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', gap: 8,
                    pointerEvents: 'none', overflow: 'hidden',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {placeholderLabel}
                    </span>
                    <span style={{ width: 1, height: '60%', background: 'var(--border2)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                      {typedPlaceholder}
                      <span style={{ display: 'inline-block', width: '2px', height: '1em', background: 'var(--ink)', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink 1s step-start infinite' }} />
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={estimate}
                disabled={!url.trim()}
                className="vb-btn"
                style={{
                  background: 'var(--ink)', color: 'var(--accent)',
                  border: '2px solid var(--ink)', fontSize: 12, fontWeight: 800,
                  cursor: url.trim() ? 'pointer' : 'default',
                  opacity: url.trim() ? 1 : 0.5,
                  letterSpacing: '0.02em', whiteSpace: 'nowrap',
                  borderRadius: 0,
                }}
              >
                Estimate value
              </button>
            </div>


            {/* Optional fields — revealed on URL blur */}
            {showOptional && (
              <div style={{ marginTop: 10, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Add more details (optional):
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Monthly visitors</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 2000"
                    value={visitors}
                    onChange={e => setVisitors(e.target.value)}
                    style={{
                      width: 90, padding: '5px 8px',
                      border: '1px solid var(--border)',
                      borderRadius: 0, fontSize: 12,
                      background: '#fff',
                      color: 'var(--ink)', outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>MRR $</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 500"
                    value={mrr}
                    onChange={e => setMrr(e.target.value)}
                    style={{
                      width: 90, padding: '5px 8px',
                      border: '1px solid var(--border)',
                      borderRadius: 0, fontSize: 12,
                      background: '#fff',
                      color: 'var(--ink)', outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            )}

            {state === 'error' && (
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>{errorMsg}</p>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .vb-row { display: flex; gap: 8px; }
        .vb-input { border-right: 2px solid var(--ink) !important; }
        .vb-btn { padding: 11px 20px; }
        @media (max-width: 480px) {
          .vb-row { flex-direction: column; }
          .vb-btn { padding: 11px 20px; width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
}
