'use client';

import { CATEGORY_COLORS } from '@/lib/data';

interface Props {
  title: string;
  category: string;
  size?: 'md' | 'lg';
  screenshotUrl?: string | null;
  platform?: string;
}

function isMobile(platform?: string) {
  return platform === 'ios' || platform === 'android' || platform === 'cross-platform';
}

export default function AppScreenPlaceholder({ title, category, size = 'md', screenshotUrl, platform }: Props) {
  const h = size === 'lg' ? 220 : 140;

  if (screenshotUrl) {
    return (
      <div style={{ height: h, overflow: 'hidden', borderRadius: size === 'lg' ? '8px 8px 0 0' : 0, flexShrink: 0 }}>
        <img src={screenshotUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
      </div>
    );
  }

  const [bg, accent] = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  const isDark = category === 'Code';
  const mobile = isMobile(platform);

  // Placeholder (no screenshot yet) — same layout for all platforms
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
