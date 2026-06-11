'use client';

import { useState } from 'react';
import { CATEGORY_COLORS } from '@/lib/data';

interface Props {
  title: string;
  category: string;
  size?: 'md' | 'lg';
  screenshotUrl?: string | null;
  screenshots?: string[];
  platform?: string;
}

function isMobile(platform?: string) {
  return platform === 'ios' || platform === 'android' || platform === 'cross-platform';
}

export default function AppScreenPlaceholder({ title, category, size = 'md', screenshotUrl, screenshots, platform }: Props) {
  const [active, setActive] = useState(0);

  const allShots = screenshots && screenshots.length > 0
    ? screenshots
    : screenshotUrl ? [screenshotUrl] : [];

  const h = size === 'lg' ? 280 : 180;

  if (allShots.length > 0) {
    if (size === 'lg' && allShots.length > 1) {
      return (
        <div style={{ borderRadius: '8px 8px 0 0', overflow: 'hidden', background: 'oklch(0.1 0.01 260 / 0.04)' }}>
          {/* Main image */}
          <div style={{ height: h, overflow: 'hidden', position: 'relative' }}>
            <img
              src={allShots[active]}
              alt={`${title} screenshot ${active + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block', background: '#f4f2ee' }}
            />
          </div>
          {/* Thumbnail strip */}
          <div style={{
            display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto',
            scrollbarWidth: 'none', borderTop: '1px solid var(--border)',
            background: '#faf9f7',
          } as React.CSSProperties}>
            {allShots.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  flexShrink: 0, width: 52, height: 52, padding: 0, cursor: 'pointer',
                  border: `2px solid ${i === active ? 'var(--ink)' : 'var(--border)'}`,
                  borderRadius: 6, overflow: 'hidden', background: '#fff',
                  boxShadow: i === active ? '2px 2px 0 var(--ink)' : 'none',
                  transition: 'border-color 0.12s, box-shadow 0.12s',
                }}
              >
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Single screenshot (card or lg with only one image)
    return (
      <div style={{
        height: h, overflow: 'hidden',
        borderRadius: size === 'lg' ? '8px 8px 0 0' : 0,
        background: '#f4f2ee', flexShrink: 0,
      }}>
        <img
          src={allShots[0]}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
        />
      </div>
    );
  }

  // Placeholder
  const [bg, accent] = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  const isDark = category === 'Code';
  const mobile = isMobile(platform);
  const platformLabel = mobile
    ? (platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Mobile')
    : 'Web';

  return (
    <div style={{
      height: h, background: bg, borderRadius: size === 'lg' ? '8px 8px 0 0' : 0,
      display: 'flex', flexDirection: 'column', padding: 12, overflow: 'hidden',
      position: 'relative', gap: 6,
    }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
        {(['oklch(0.7 0.12 22)', 'oklch(0.7 0.12 80)', 'oklch(0.6 0.12 152)'] as string[]).map((c, i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c, opacity: 0.6 }} />
        ))}
        <div style={{ flex: 1, height: 7, background: isDark ? 'oklch(0.3 0.02 260)' : 'oklch(0.88 0.02 80)', borderRadius: 4, marginLeft: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        <div style={{ width: size === 'lg' ? 80 : 50, background: isDark ? 'oklch(0.2 0.02 260)' : 'oklch(0.1 0.01 260 / 0.06)', borderRadius: 6 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {Array.from({ length: size === 'lg' ? 5 : 3 }).map((_, i) => (
            <div key={i} style={{ height: 10, background: accent, borderRadius: 3, opacity: 0.3 + i * 0.1, width: `${100 - i * 12}%` }} />
          ))}
          <div style={{ marginTop: 'auto', height: 22, background: accent, borderRadius: 5, width: 80, opacity: 0.7 }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 9, color: isDark ? 'oklch(0.6 0.02 260)' : 'oklch(0.5 0.01 260 / 0.5)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
        {platformLabel}
      </div>
    </div>
  );
}
