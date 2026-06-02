'use client';

import { useState } from 'react';

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
  const [url, setUrl] = useState('');
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

      if (res.status === 422) {
        setState('error');
        setErrorMsg("Couldn't fetch app data — check the URL and try again.");
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
      background: 'var(--ink)',
      padding: '28px 24px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            What&apos;s your app worth?
          </span>
          <span style={{ fontSize: 12, color: 'oklch(0.75 0.01 80)' }}>
            Paste a URL — get a 30-second valuation
          </span>
        </div>

        {state === 'result' && result ? (
          /* ── Result state ── */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.03em' }}>
                {formatCurrency(result.low)} – {formatCurrency(result.high)}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                border: '2px solid var(--accent)', color: 'var(--accent)',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {CONFIDENCE_LABELS[result.confidence]}
              </span>
            </div>

            <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.rationale.map((r, i) => (
                <li key={i} style={{ fontSize: 12, color: 'oklch(0.8 0.01 80)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => onListThisApp(url.trim())}
                style={{
                  padding: '10px 20px', background: 'var(--accent)', color: 'var(--ink)',
                  border: '2px solid var(--accent)', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', letterSpacing: '0.02em', whiteSpace: 'nowrap',
                  boxShadow: '3px 3px 0px oklch(0.75 0.12 128)',
                }}
              >
                List this app →
              </button>
              <button
                onClick={reset}
                style={{
                  padding: '10px 16px', background: 'transparent', color: 'oklch(0.65 0.01 80)',
                  border: '2px solid oklch(0.35 0.01 80)', fontSize: 12, fontWeight: 600,
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
              width: 16, height: 16, border: '2px solid oklch(0.4 0.01 80)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: 'oklch(0.75 0.01 80)' }}>
              Analyzing your app… (up to 15s for mobile apps)
            </span>
          </div>

        ) : (
          /* ── Idle / Error state ── */
          <div>
            <div style={{ display: 'flex', gap: 0 }}>
              <input
                type="text"
                placeholder="myapp.com  or  App Store / Play Store URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                onKeyDown={e => e.key === 'Enter' && estimate()}
                style={{
                  flex: 1, padding: '11px 14px',
                  border: '2px solid oklch(0.35 0.01 80)',
                  borderRight: 'none',
                  borderRadius: 0, fontSize: 13,
                  outline: 'none', background: 'oklch(0.12 0.01 80)',
                  color: '#fff',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={estimate}
                disabled={!url.trim()}
                style={{
                  padding: '11px 20px', background: 'var(--accent)', color: 'var(--ink)',
                  border: '2px solid var(--accent)', fontSize: 12, fontWeight: 800,
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
                <span style={{ fontSize: 11, color: 'oklch(0.6 0.01 80)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Add more details (optional):
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'oklch(0.6 0.01 80)', whiteSpace: 'nowrap' }}>Monthly visitors</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 2000"
                    value={visitors}
                    onChange={e => setVisitors(e.target.value)}
                    style={{
                      width: 90, padding: '5px 8px',
                      border: '1px solid oklch(0.35 0.01 80)',
                      borderRadius: 0, fontSize: 12,
                      background: 'oklch(0.12 0.01 80)',
                      color: '#fff', outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'oklch(0.6 0.01 80)', whiteSpace: 'nowrap' }}>MRR $</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 500"
                    value={mrr}
                    onChange={e => setMrr(e.target.value)}
                    style={{
                      width: 90, padding: '5px 8px',
                      border: '1px solid oklch(0.35 0.01 80)',
                      borderRadius: 0, fontSize: 12,
                      background: 'oklch(0.12 0.01 80)',
                      color: '#fff', outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            )}

            {state === 'error' && (
              <p style={{ marginTop: 8, fontSize: 12, color: 'oklch(0.75 0.15 25)' }}>{errorMsg}</p>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
