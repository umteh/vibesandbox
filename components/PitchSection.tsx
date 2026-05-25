'use client';

import { ListingMetadata } from '@/lib/metadata';

const HOOK_MAX = 140;

interface Props {
  value: ListingMetadata['pitch'];
  onChange: (v: ListingMetadata['pitch']) => void;
}

export default function PitchSection({ value = {}, onChange }: Props) {
  const hook = value.hook ?? '';

  function set(patch: Partial<NonNullable<ListingMetadata['pitch']>>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Hook */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            The Hook
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)', marginLeft: 6 }}>What makes a buyer stop scrolling?</span>
          </label>
          <span style={{ fontSize: 11, color: hook.length > HOOK_MAX * 0.9 ? 'var(--red)' : 'var(--text3)' }}>
            {hook.length}/{HOOK_MAX}
          </span>
        </div>
        <input
          type="text"
          maxLength={HOOK_MAX}
          placeholder="e.g. The only AI that learns your writing voice from 30 days of emails."
          value={hook}
          onChange={e => set({ hook: e.target.value })}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--bg)' }}
        />
      </div>

      {/* Traction */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Traction
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)', marginLeft: 6 }}>Trust-based reporting — no verification required</span>
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Monthly Active Users</label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 1200"
              value={value.mau ?? ''}
              onChange={e => set({ mau: e.target.value ? Number(e.target.value) : undefined })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--bg)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Revenue / MRR (USD)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>$</span>
              <input
                type="number"
                min={0}
                placeholder="e.g. 3400"
                value={value.mrr ?? ''}
                onChange={e => set({ mrr: e.target.value ? Number(e.target.value) : undefined })}
                style={{ width: '100%', padding: '8px 12px 8px 22px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--bg)' }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
