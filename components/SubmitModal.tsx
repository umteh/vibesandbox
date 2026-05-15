'use client';

import { useState, useRef } from 'react';
import { CATEGORIES, Listing } from '@/lib/data';
import { ListingMetadata } from '@/lib/metadata';
import PitchSection from './PitchSection';
import DueDiligenceSection from './DueDiligenceSection';

type Platform = 'web' | 'ios' | 'android' | 'cross-platform';

interface FormData {
  title: string;
  url: string;
  description: string;
  category: string;
  platform: Platform;
  price: string;
  priceType: 'fixed' | 'offer' | 'free';
  screenshotPreview: string | null;
  screenshotFile: File | null;
}

interface Props {
  onClose: () => void;
  onSubmitListing: (listing: Partial<Listing>) => void;
  user: string | null;
  supabaseUserId: string | null;
}

export default function SubmitModal({ onClose, onSubmitListing, user, supabaseUserId }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    title: '', url: '', description: '', category: 'Productivity', platform: 'web',
    price: '', priceType: 'fixed', screenshotPreview: null, screenshotFile: null,
  });
  const [metadata, setMetadata] = useState<ListingMetadata>({});
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({
      ...f,
      screenshotPreview: ev.target?.result as string,
      screenshotFile: file,
    }));
    reader.readAsDataURL(file);
  }

  async function uploadScreenshot(file: File): Promise<string | null> {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/screenshot', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) { console.error('[upload]', await res.text()); return null; }
      const { url } = await res.json();
      return url ?? null;
    } catch (err) {
      console.error('[upload] unexpected error:', err);
      return null;
    }
  }

  // Called from step 3 — actual API submission
  async function doSubmit(includeMetadata: boolean): Promise<boolean> {
    setSubmitting(true);
    setError(null);

    try {
      const screenshotUrl = form.screenshotFile
        ? await uploadScreenshot(form.screenshotFile)
        : null;

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          url: form.url,
          description: form.description,
          category: form.category,
          priceType: form.priceType,
          price: form.priceType === 'fixed' ? parseFloat(form.price) : null,
          tags: [],
          screenshotUrl,
          metadata: includeMetadata ? metadata : {},
          platform: form.platform,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.status === 429) { setError(data.error ?? 'Submission limit reached this week.'); return false; }
      if (res.status === 401) { setError('Please sign in to submit a listing.'); return false; }
      if (!res.ok) { setError(data.error ?? 'Submission failed. Try again.'); return false; }

      setCreatedId(data.id);
      onSubmitListing({
        id: data.id,
        title: form.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listing_metadata: (includeMetadata ? metadata : {}) as any,
        url: form.url,
        tagline: form.description,
        category: form.category,
        price: form.priceType === 'fixed' ? parseFloat(form.price) : null,
        priceType: form.priceType,
        creator: user ?? 'You',
        avatar: (user ?? 'YO').slice(0, 2).toUpperCase(),
        status: 'pending',
        tags: [],
        createdAt: 'just now',
        screenshotUrl: screenshotUrl ?? form.screenshotPreview,
        platform: form.platform,
      });
      return true;
    } catch {
      setError('Network error. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  // Kept to satisfy form onSubmit — should not fire (step 2 button is type="button")
  function submit(e: React.FormEvent) { e.preventDefault(); }

  return (
    <div className="overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-slide-up" style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        width: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Submit your app</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>AI scores every listing — usually &lt;5 min</div>
          </div>
          <button onClick={onClose} style={{ fontSize: 22, color: 'var(--text3)' }}>×</button>
        </div>

        {step === 4 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Listing submitted!</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>
              Your listing is live with a &ldquo;Scoring…&rdquo; badge. Share the link — AI scoring runs in the background.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>Score typically arrives within 5 minutes.</p>
            <button onClick={onClose} style={{ marginTop: 24, padding: '10px 24px', background: 'var(--blue)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
              View listing →
            </button>
          </div>

        ) : step === 3 ? (
          /* ── Step 3: Pitch & Due Diligence (optional) ── */
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {['App details', 'Pricing', 'Pitch & Info'].map((s, i) => (
                <div key={i} style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  background: step === i + 1 ? 'var(--blue)' : 'var(--bg3)',
                  color: step === i + 1 ? '#fff' : 'var(--text3)',
                  border: `1px solid ${step === i + 1 ? 'var(--blue)' : 'var(--border)'}`,
                }}>{i + 1}. {s}</div>
              ))}
            </div>

            <div style={{ padding: '10px 14px', background: 'var(--blue-light)', border: '1px solid var(--blue)', borderRadius: 8, fontSize: 12, color: 'var(--blue)', marginBottom: 20 }}>
              Optional — fill in what you have. This improves your AI score and signals to buyers that you&apos;re serious.
            </div>

            {/* Pitch */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                The Pitch
              </div>
              <PitchSection
                value={metadata.pitch}
                onChange={v => setMetadata(m => ({ ...m, pitch: v }))}
              />
            </div>

            {/* Due Diligence */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                Due Diligence
              </div>
              <DueDiligenceSection
                value={metadata.due_diligence}
                onChange={v => setMetadata(m => ({ ...m, due_diligence: v }))}
              />
            </div>

            {/* Anything else */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                Anything else?
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                Known issues, growth plans, why you're selling, deal structure preferences — anything a serious buyer should know.
              </p>
              <textarea
                rows={4}
                placeholder="e.g. The main reason I'm selling is I'm starting a new project. Revenue is seasonal — peaks in Q4. Happy to do a 2-week handover."
                value={(metadata as { notes?: string }).notes ?? ''}
                onChange={e => setMetadata(m => ({ ...m, notes: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', background: 'var(--bg)', lineHeight: 1.6 }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(2)}
                style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--text2)', background: 'var(--bg)' }}>
                ← Back
              </button>
              <button type="button" disabled={submitting}
                onClick={async () => { const ok = await doSubmit(false); if (ok) setStep(4); }}
                style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--text3)', background: 'var(--bg)', opacity: submitting ? 0.6 : 1 }}>
                Skip
              </button>
              <button type="button" disabled={submitting}
                onClick={async () => { const ok = await doSubmit(true); if (ok) setStep(4); }}
                style={{ flex: 2, padding: 11, background: 'var(--blue)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? (
                  <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />Submitting…</>
                ) : 'Submit →'}
              </button>
            </div>
          </div>

        ) : (
          <form onSubmit={submit} style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {['App details', 'Pricing', 'Pitch & Info'].map((s, i) => (
                <div key={i} style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  background: step === i + 1 ? 'var(--blue)' : 'var(--bg3)',
                  color: step === i + 1 ? '#fff' : 'var(--text3)',
                  border: `1px solid ${step === i + 1 ? 'var(--blue)' : 'var(--border)'}`,
                }}>{i + 1}. {s}</div>
              ))}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, color: 'var(--text)', marginBottom: 14 }}>
                {error}
              </div>
            )}

            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* App name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                    App name <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input type="text" required value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)' }} />
                </div>
                {/* Platform */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                    Platform <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([['web', '🌐 Web'], ['ios', '🍎 iOS'], ['android', '🤖 Android'], ['cross-platform', '📱 Cross-platform']] as const).map(([v, l]) => (
                      <button type="button" key={v} onClick={() => setForm(f => ({ ...f, platform: v }))} style={{
                        flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        border: `2px solid ${form.platform === v ? 'var(--ink)' : 'var(--border)'}`,
                        background: form.platform === v ? 'var(--accent)' : 'var(--bg)',
                        color: form.platform === v ? 'var(--ink)' : 'var(--text2)',
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
                {/* URL */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                    {form.platform === 'ios' ? 'App Store URL' : form.platform === 'android' ? 'Play Store URL' : form.platform === 'cross-platform' ? 'App Store or Play Store URL' : 'App URL'} <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input type="url" required placeholder={form.platform === 'ios' ? 'App Store URL' : form.platform === 'android' ? 'Play Store URL' : form.platform === 'cross-platform' ? 'App Store or Play Store URL' : 'e.g. myapp.com'} value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                    Description <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <textarea required rows={3} placeholder="One sentence that nails who suffers and why your app solves it."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', background: 'var(--bg)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                    Category <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)' }}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                    Screenshot <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>(optional — helps the AI score)</span>
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                  {form.screenshotPreview ? (
                    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.screenshotPreview} alt="screenshot preview" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                      <button type="button"
                        onClick={() => { setForm(f => ({ ...f, screenshotPreview: null, screenshotFile: null })); if (fileRef.current) fileRef.current.value = ''; }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'oklch(0.1 0.01 260 / 0.7)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} style={{
                      width: '100%', padding: 20, border: '1.5px dashed var(--border2)', borderRadius: 8,
                      background: 'var(--bg)', color: 'var(--text3)', fontSize: 13, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'border-color 0.15s, background 0.15s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-light)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'; }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                      </svg>
                      <span>Upload screenshot</span>
                      <span style={{ fontSize: 11 }}>PNG, JPG up to 5MB</span>
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => setStep(2)}
                  disabled={!form.title || !form.url || !form.description}
                  style={{ padding: 11, background: 'var(--blue)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, opacity: (!form.title || !form.url || !form.description) ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>
                    Pricing model <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([['fixed', 'Fixed price'], ['offer', 'Make offer'], ['free', 'Free']] as const).map(([v, l]) => (
                      <button type="button" key={v} onClick={() => setForm(f => ({ ...f, priceType: v }))} style={{
                        flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        border: `1.5px solid ${form.priceType === v ? 'var(--blue)' : 'var(--border)'}`,
                        background: form.priceType === v ? 'var(--blue-light)' : 'var(--bg)',
                        color: form.priceType === v ? 'var(--blue)' : 'var(--text2)',
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
                {form.priceType === 'fixed' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                      Price (USD) <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14 }}>$</span>
                      <input type="number" min="1" required placeholder="49" value={form.price}
                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px 9px 24px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)' }} />
                    </div>
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
                  No payment processing. Buyers contact you directly via encrypted relay. You close deals off-platform.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--text2)', background: 'var(--bg)' }}>
                    ← Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} style={{
                    flex: 2, padding: 11, background: 'var(--blue)', color: '#fff', borderRadius: 8,
                    fontSize: 14, fontWeight: 600,
                  }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
