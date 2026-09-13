import styles from './Ring.module.css';

interface RingProps {
  size?: number;
  stroke?: number;
  /** 0..1 */
  value: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
  className?: string;
  /** When set, the ring animates from empty to full over this many ms (used for bot timers). */
  animateMs?: number;
  label?: string;
}

export function Ring({
  size = 48,
  stroke = 4,
  value,
  color = 'var(--gold)',
  track = 'rgba(255,255,255,0.12)',
  children,
  className,
  animateMs,
  label,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const style: React.CSSProperties = animateMs
    ? { animationDuration: `${animateMs}ms`, strokeDasharray: c, ['--ring-c' as string]: c }
    : { strokeDasharray: c, strokeDashoffset: c * (1 - clamped) };
  return (
    <div className={`${styles.wrap} ${className ?? ''}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          className={animateMs ? styles.animated : styles.static}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={style}
        />
      </svg>
      {children ? <div className={styles.center}>{children}</div> : null}
    </div>
  );
}
