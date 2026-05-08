'use client';

import { scoreColor } from '@/lib/data';

interface Props {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  if (score === null) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'lg' ? '6px 12px' : '4px 10px',
        borderRadius: 999, background: 'var(--bg3)', border: '1px solid var(--border)',
        fontSize: size === 'lg' ? 13 : 11, fontWeight: 500, color: 'var(--text3)',
        fontFamily: "'DM Mono', monospace", letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}>
        <span className="animate-pulse-dot" style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--amber)', display: 'inline-block', flexShrink: 0,
        }} />
        Scoring…
      </span>
    );
  }

  const c = scoreColor(score);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'lg' ? '6px 14px' : '4px 10px',
      borderRadius: 999, background: c.bg,
      fontSize: size === 'lg' ? 15 : 12, fontWeight: 700, color: c.text,
      fontFamily: "'DM Mono', monospace", letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {score}
      <span style={{ fontSize: size === 'lg' ? 11 : 9, fontWeight: 500, opacity: 0.7 }}>/100</span>
    </span>
  );
}
