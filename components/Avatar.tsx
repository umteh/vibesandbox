'use client';

import { AVATAR_COLORS } from '@/lib/data';

interface Props {
  initials: string;
  size?: number;
}

export default function Avatar({ initials, size = 24 }: Props) {
  const bg = AVATAR_COLORS[initials] || 'var(--blue)';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.38, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
        {initials}
      </span>
    </div>
  );
}
