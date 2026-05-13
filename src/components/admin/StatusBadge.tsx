interface StatusBadgeProps {
  color: string;
  bg?: string;
  label: string;
  dot?: boolean;
}

export default function StatusBadge({ color, bg, label, dot = true }: StatusBadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: bg ?? `${color}18`,
      fontSize: 11, fontWeight: 800, color, letterSpacing: 0.3,
    }}>
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}/>
      )}
      {label}
    </span>
  );
}
