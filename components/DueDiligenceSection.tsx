'use client';

import { ListingMetadata } from '@/lib/metadata';
import TagInput from './TagInput';

const INFRA = ['Next.js', 'React', 'Node.js', 'Python', 'FastAPI', 'Supabase', 'PostgreSQL', 'Redis', 'Pinecone', 'Weaviate', 'Chroma', 'LangChain', 'LlamaIndex', 'Vercel', 'AWS', 'GCP', 'Stripe', 'Resend'];

const MAINTENANCE_OPTIONS = [
  { value: 'low', label: 'Set it and forget it', desc: 'Runs itself, <1h/month' },
  { value: 'medium', label: 'Weekly updates', desc: 'Prompt tuning, minor fixes' },
  { value: 'high', label: 'High touch', desc: 'Manual ops or daily attention' },
] as const;

const ASSETS = [
  { key: 'domain', label: 'Domain' },
  { key: 'github', label: 'GitHub Repository' },
  { key: 'social_media', label: 'Social Media Accounts' },
  { key: 'customer_database', label: 'Customer Database' },
  { key: 'documentation', label: 'Documentation / SOPs' },
] as const;

interface Props {
  value: ListingMetadata['due_diligence'];
  onChange: (v: ListingMetadata['due_diligence']) => void;
}

export default function DueDiligenceSection({ value = {}, onChange }: Props) {
  function set(patch: Partial<NonNullable<ListingMetadata['due_diligence']>>) {
    onChange({ ...value, ...patch });
  }

  function setStack(patch: Partial<NonNullable<ListingMetadata['due_diligence']>['tech_stack']>) {
    set({ tech_stack: { ...value.tech_stack, ...patch } });
  }

  function setAsset(key: string, checked: boolean) {
    set({ assets_included: { ...value.assets_included, [key]: checked } });
  }

  const assets = value.assets_included ?? {};
  const maintenance = value.maintenance_level;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Tech Stack */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
          Tech Stack
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text3)', marginBottom: 6 }}>
              Infrastructure — frameworks, DBs, hosting
            </label>
            <TagInput
              tags={value.tech_stack?.infrastructure ?? []}
              onChange={t => setStack({ infrastructure: t })}
              placeholder="Next.js, Supabase, Pinecone…"
              suggestions={INFRA}
            />
          </div>
        </div>
      </div>

      {/* Operations */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
          Operations
        </label>
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text3)', marginBottom: 6 }}>
              Monthly Burn — API + hosting costs (USD/mo)
            </label>
            <div style={{ position: 'relative', maxWidth: 200 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>$</span>
              <input
                type="number"
                min={0}
                placeholder="e.g. 120"
                value={value.monthly_burn ?? ''}
                onChange={e => set({ monthly_burn: e.target.value ? Number(e.target.value) : undefined })}
                style={{ width: '100%', padding: '8px 12px 8px 22px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--bg)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text3)', marginBottom: 8 }}>
              Maintenance Level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MAINTENANCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set({ maintenance_level: opt.value })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                    border: `1.5px solid ${maintenance === opt.value ? 'var(--blue)' : 'var(--border)'}`,
                    background: maintenance === opt.value ? 'var(--blue-light)' : 'var(--bg)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${maintenance === opt.value ? 'var(--blue)' : 'var(--border2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {maintenance === opt.value && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: maintenance === opt.value ? 'var(--blue)' : 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assets Included */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Included in Sale
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)', marginLeft: 6 }}>Checked assets signal acquisition-ready status to buyers</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          {ASSETS.map(asset => {
            const checked = !!(assets as Record<string, boolean>)[asset.key];
            return (
              <button
                key={asset.key}
                type="button"
                onClick={() => setAsset(asset.key, !checked)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                  border: `1.5px solid ${checked ? 'var(--green)' : 'var(--border)'}`,
                  background: checked ? 'var(--green-light)' : 'var(--bg)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${checked ? 'var(--green)' : 'var(--border2)'}`,
                  background: checked ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: checked ? 'var(--green)' : 'var(--text2)' }}>{asset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
