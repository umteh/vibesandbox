'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Listing } from '@/lib/data';
import ListingCard from './ListingCard';

type SortKey = 'new' | 'value';

function parseValuation(listing: Listing): number {
  const val = (listing.listing_metadata as { valuation?: { low: string } } | null)?.valuation;
  if (!val?.low) return -1;
  const s = val.low.replace(/[$,\s]/g, '').toUpperCase();
  const num = parseFloat(s);
  if (isNaN(num)) return -1;
  if (s.endsWith('M')) return num * 1_000_000;
  if (s.endsWith('K')) return num * 1_000;
  return num;
}

export default function RadarClient({ listings }: { listings: Listing[] }) {
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortKey>('new');
  const router = useRouter();

  const categories = useMemo(() => {
    const seen = new Set<string>();
    listings.forEach(l => { if (l.category) seen.add(l.category); });
    return ['All', ...Array.from(seen).sort()];
  }, [listings]);

  const filtered = useMemo(() => {
    let list = category === 'All' ? listings : listings.filter(l => l.category === category);
    if (sort === 'value') {
      list = [...list].sort((a, b) => parseValuation(b) - parseValuation(a));
    }
    return list;
  }, [listings, category, sort]);

  return (
    <>
      {/* Filters bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                border: `2px solid ${category === c ? 'var(--ink)' : 'var(--border2)'}`,
                background: category === c ? 'var(--ink)' : 'transparent',
                color: category === c ? 'var(--accent)' : 'var(--text2)',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>Sort:</span>
          {([['new', 'Newest'], ['value', 'Est. value']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setSort(v)}
              style={{
                padding: '5px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: sort === v ? 'var(--accent)' : 'transparent',
                color: sort === v ? 'var(--ink)' : 'var(--text3)',
                border: `2px solid ${sort === v ? 'var(--ink)' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{filtered.length}</span>
        {' '}app{filtered.length !== 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Nothing in {category} yet</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {filtered.map((l, i) => (
            <ListingCard key={l.id} listing={l} showBreakdown index={i} />
          ))}
        </div>
      )}
    </>
  );
}
