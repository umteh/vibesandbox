'use client';

interface Props {
  label: string;
  value: number;
  weight: number;
}

function dimColor(v: number) {
  if (v >= 8) return 'var(--green)';
  if (v >= 6) return 'var(--blue)';
  if (v >= 4) return 'var(--amber)';
  return 'var(--red)';
}

export default function DimBar({ label, value, weight }: Props) {
  const pct = (value / 10) * 100;
  const c = dimColor(value);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: c, fontFamily: "'DM Mono', monospace" }}>{value}/10</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 2, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}
