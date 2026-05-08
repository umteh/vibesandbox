interface Props {
  children: React.ReactNode;
}

export default function Tag({ children }: Props) {
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 4,
      background: 'var(--bg3)', border: '1px solid var(--border)',
      color: 'var(--text3)', fontWeight: 500,
    }}>
      #{children}
    </span>
  );
}
