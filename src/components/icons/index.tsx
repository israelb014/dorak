import type { SVGProps } from 'react';
import type { Suit } from '../../engine';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number | undefined, props: IconProps) {
  const { size: _s, ...rest } = props;
  return {
    width: size ?? 24,
    height: size ?? 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Suits (filled)
// ---------------------------------------------------------------------------

export function SpadeIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} stroke="none" fill="currentColor">
      <path d="M12 2.5c2.7 3.4 7.5 6.6 7.5 10.6 0 2.4-1.8 4.2-4 4.2-1.3 0-2.5-.6-3.2-1.6.2 1.9.9 3.2 2.3 4.3H9.4c1.4-1.1 2.1-2.4 2.3-4.3-.7 1-1.9 1.6-3.2 1.6-2.2 0-4-1.8-4-4.2 0-4 4.8-7.2 7.5-10.6z" />
    </svg>
  );
}

export function HeartIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} stroke="none" fill="currentColor">
      <path d="M12 21.2C7.2 16.9 3 13.5 3 8.9 3 6.1 5.1 4 7.7 4c1.8 0 3.3 1 4.3 2.6C13 5 14.5 4 16.3 4 18.9 4 21 6.1 21 8.9c0 4.6-4.2 8-9 12.3z" />
    </svg>
  );
}

export function DiamondIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} stroke="none" fill="currentColor">
      <path d="M12 2.6 20 12l-8 9.4L4 12z" />
    </svg>
  );
}

export function ClubIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} stroke="none" fill="currentColor">
      <path d="M12 2.8a4 4 0 0 1 3.7 5.5 4 4 0 1 1-2.5 7.2c.2 1.9.9 3.2 2.3 4.5H8.5c1.4-1.3 2.1-2.6 2.3-4.5a4 4 0 1 1-2.5-7.2A4 4 0 0 1 12 2.8z" />
    </svg>
  );
}

export function SuitIcon({ suit, ...props }: IconProps & { suit: Suit }) {
  switch (suit) {
    case 'S':
      return <SpadeIcon {...props} />;
    case 'H':
      return <HeartIcon {...props} />;
    case 'D':
      return <DiamondIcon {...props} />;
    case 'C':
      return <ClubIcon {...props} />;
  }
}

// ---------------------------------------------------------------------------
// UI icons (stroked)
// ---------------------------------------------------------------------------

export function PlayIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GearIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function BookIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  );
}

export function ChartIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function BackIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function VolumeIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function VolumeOffIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" stroke="none" />
      <path d="m22 9-6 6M16 9l6 6" />
    </svg>
  );
}

export function ResetIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function CheckIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function HandIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V6a1.5 1.5 0 0 1 3 0v6" />
      <path d="M17 12V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.5a7 7 0 0 1-5.6-2.8L3.2 14a1.6 1.6 0 0 1 2.5-2L8 14.5" />
    </svg>
  );
}

export function TransferIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 7h13M13 3l4 4-4 4" />
      <path d="M20 17H7M11 13l-4 4 4 4" />
    </svg>
  );
}

export function CrownIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CardsIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3" y="6" width="11" height="15" rx="2" />
      <path d="M9.5 3.3 19 5.6a2 2 0 0 1 1.5 2.4L18 18.6" />
    </svg>
  );
}

export function SwordIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M14.5 3.5 20 4l.5 5.5L9.5 20.5 3.5 14.5z" />
      <path d="m13 8 3 3M3 21l3-3" />
    </svg>
  );
}

export function ShieldIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 2.5 4.5 5.5v6c0 4.8 3.2 8.4 7.5 10 4.3-1.6 7.5-5.2 7.5-10v-6z" />
    </svg>
  );
}

export function UsersIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2" />
    </svg>
  );
}

export function ZapIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrophyIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    </svg>
  );
}
