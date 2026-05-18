'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Listing, CATEGORIES, priceDisplay } from '@/lib/data';
import { ListingMetadata } from '@/lib/metadata';
import PitchSection from './PitchSection';
import DueDiligenceSection from './DueDiligenceSection';

interface Props {
  listing: Listing;
}

export default function ListingOwnerActions({ listing }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: listing.title,
    url: listing.url,
    description: listing.tagline,
    category: listing.category,
    priceType: listing.priceType,
    price: listing.price ? String(listing.price) : '',
  });
  const [metadata, setMetadata] = useState<ListingMetadata>(
    (listing.listing_metadata as ListingMetadata) ?? {}
  );

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      router.push('/feed');
    } else {
      setDeleting(false);
      setError('Delete failed. Try again.');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: form.title,
        url: form.url,
        description: form.description,
        category: form.category,
        price_type: form.priceType,
        price_cents: form.priceType === 'fixed' && form.price ? Math.round(parseFloat(form.price) * 100) : null,
        listing_metadata: metadata,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError('Save failed. Try again.');
    }
  }

  const price = priceDisplay(listing);

  if (editing) {
    return (
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Edit listing</div>
        {error && (
          <div style={{ padding: '8px 12px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {([['title', 'App name', 'text'], ['url', 'App URL', 'text']] as const).map(([id, label, type]) => (
            <div key={id}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>{label}</label>
              <input type={type} required value={form[id]} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>Description</label>
            <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', background: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Pricing</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: form.priceType === 'fixed' ? 10 : 0 }}>
              {([['fixed', 'Fixed'], ['offer', 'Make offer'], ['free', 'Free']] as const).map(([v, l]) => (
                <button type="button" key={v} onClick={() => setForm(f => ({ ...f, priceType: v }))} style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: `1.5px solid ${form.priceType === v ? 'var(--blue)' : 'var(--border)'}`,
                  background: form.priceType === v ? 'var(--blue-light)' : 'var(--bg)',
                  color: form.priceType === v ? 'var(--blue)' : 'var(--text2)',
                }}>{l}</button>
              ))}
            </div>
            {form.priceType === 'fixed' && (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>$</span>
                <input type="number" min="1" placeholder="49" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px 9px 22px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }} />
              </div>
            )}
          </div>
          {/* Pitch */}
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>The Pitch</div>
            <PitchSection
              value={metadata.pitch}
              onChange={v => setMetadata(m => ({ ...m, pitch: v }))}
            />
          </div>

          {/* Due Diligence */}
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Due Diligence</div>
            <DueDiligenceSection
              value={metadata.due_diligence}
              onChange={v => setMetadata(m => ({ ...m, due_diligence: v }))}
            />
          </div>

          {/* Notes */}
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Anything else?</div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
              Known issues, growth plans, why you&apos;re selling, deal preferences.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Revenue is seasonal — peaks in Q4. Happy to do a 2-week handover."
              value={(metadata as { notes?: string }).notes ?? ''}
              onChange={e => setMetadata(m => ({ ...m, notes: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', background: '#fff', lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => setEditing(false)}
              style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--text2)', background: 'var(--bg)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: 11, background: 'var(--blue)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? (
                <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />Saving…</>
              ) : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>
        You own this listing
      </div>
      {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setEditing(true)} style={{
          padding: '8px 18px', border: '1.5px solid var(--border2)', borderRadius: 8,
          fontSize: 13, fontWeight: 600, color: 'var(--text)', background: '#fff', cursor: 'pointer',
        }}>
          Edit
        </button>
        <button onClick={() => setConfirmDelete(true)} style={{
          padding: '8px 18px', border: '1.5px solid var(--red)', borderRadius: 8,
          fontSize: 13, fontWeight: 600, color: 'var(--red)', background: 'var(--red-light)', cursor: 'pointer',
        }}>
          Delete
        </button>
      </div>

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-slide-up" style={{
            background: '#fff', borderRadius: 'var(--radius-lg)', width: 400,
            padding: 28, boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Remove {listing.title}?</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 24 }}>
              No worries — you can always resubmit it later. Just heads up that any buyer inquiries linked to this listing will no longer work.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{
                flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 14, fontWeight: 500, color: 'var(--text2)', background: 'var(--bg)', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: '10px', background: 'var(--red)', color: '#fff', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {deleting ? (
                  <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />Deleting…</>
                ) : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
