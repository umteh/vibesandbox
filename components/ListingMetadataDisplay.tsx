import { ListingMetadata, pitchStrength, strengthLabel } from '@/lib/metadata';

type MetadataWithNotes = ListingMetadata & { notes?: string };

const MAINTENANCE_LABELS = {
  low: 'Set it and forget it',
  medium: 'Weekly updates needed',
  high: 'High touch / Manual ops',
};

const ASSET_LABELS: Record<string, string> = {
  domain: 'Domain',
  github: 'GitHub Repository',
  social_media: 'Social Media',
  customer_database: 'Customer Database',
  documentation: 'Documentation / SOPs',
};

interface Props {
  metadata: MetadataWithNotes;
}

export default function ListingMetadataDisplay({ metadata }: Props) {
  const { pitch, due_diligence: dd, notes } = metadata;
  const hasContent =
    pitch?.hook || pitch?.secret_sauce || pitch?.mau || pitch?.mrr ||
    dd?.tech_stack?.foundation?.length || dd?.tech_stack?.infrastructure?.length ||
    dd?.monthly_burn || dd?.maintenance_level ||
    Object.values(dd?.assets_included ?? {}).some(Boolean) ||
    notes;

  if (!hasContent) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>

      {/* Pitch section */}
      {(pitch?.hook || pitch?.secret_sauce || pitch?.mau || pitch?.mrr) && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>The Pitch</div>

          {pitch.hook && (
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5, marginBottom: 14 }}>
              &ldquo;{pitch.hook}&rdquo;
            </p>
          )}

          {pitch.secret_sauce && (() => {
            const strength = pitchStrength(pitch.secret_sauce);
            const sl = strengthLabel(strength);
            return (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>AI Secret Sauce</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: sl.color,
                    padding: '2px 8px', borderRadius: 999, background: sl.bg }}>
                    {sl.label}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{pitch.secret_sauce}</p>
                <div style={{ marginTop: 8, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${strength}%`, height: '100%', background: sl.color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })()}

          {(pitch.mau || pitch.mrr) && (
            <div style={{ display: 'flex', gap: 16 }}>
              {pitch.mau && (
                <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Monthly Active Users</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                    {pitch.mau.toLocaleString()}
                  </div>
                </div>
              )}
              {pitch.mrr && (
                <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>MRR</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--green)' }}>
                    ${pitch.mrr.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Due Diligence */}
      {(dd?.tech_stack?.foundation?.length || dd?.tech_stack?.infrastructure?.length ||
        dd?.monthly_burn || dd?.maintenance_level ||
        Object.values(dd?.assets_included ?? {}).some(Boolean)) && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Due Diligence</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tech Stack */}
            {(dd?.tech_stack?.foundation?.length || dd?.tech_stack?.infrastructure?.length) && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Tech Stack</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dd.tech_stack?.foundation?.length && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)', width: 90, flexShrink: 0 }}>AI Foundation</span>
                      {dd.tech_stack.foundation.map(t => (
                        <span key={t} style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--blue-light)', border: '1px solid var(--blue)', fontSize: 11, fontWeight: 500, color: 'var(--blue)' }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {dd.tech_stack?.infrastructure?.length && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)', width: 90, flexShrink: 0 }}>Infrastructure</span>
                      {dd.tech_stack.infrastructure.map(t => (
                        <span key={t} style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 500, color: 'var(--text2)' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Operations */}
            {(dd?.monthly_burn || dd?.maintenance_level) && (
              <div style={{ display: 'flex', gap: 12 }}>
                {dd.monthly_burn && (
                  <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Monthly Burn</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>${dd.monthly_burn}/mo</div>
                  </div>
                )}
                {dd.maintenance_level && (
                  <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Maintenance</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {MAINTENANCE_LABELS[dd.maintenance_level]}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assets */}
            {Object.values(dd?.assets_included ?? {}).some(Boolean) && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Included in Sale</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(dd?.assets_included ?? {}).filter(([, v]) => v).map(([k]) => (
                    <span key={k} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--green-light)', border: '1px solid var(--green)',
                      fontSize: 12, fontWeight: 500, color: 'var(--green)',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {ASSET_LABELS[k] ?? k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seller notes */}
      {notes && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>From the seller</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{notes}</p>
        </div>
      )}
    </div>
  );
}
