// Small hand-written line icons for the TV redesign. The design spec calls
// for Phosphor icons, but pulling in a whole icon package for ~15 glyphs
// isn't worth the new dependency — these are plain stroke SVGs matching
// Phosphor's "regular" weight look closely enough. Size/color come from the
// caller via className/style (color defaults to currentColor).

type IconProps = { className?: string; style?: React.CSSProperties };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function SearchIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function HeartIcon({ className, style, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base} className={className} style={style} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.5s-7.5-4.6-9.9-9.3C.6 7.8 2.2 4.5 5.4 3.8c2-.4 3.9.5 5 2.1a.8.8 0 0 0 1.2 0c1.1-1.6 3-2.5 5-2.1 3.2.7 4.8 4 3.3 7.4-2.4 4.7-9.9 9.3-9.9 9.3Z" />
    </svg>
  );
}

export function GearIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H2.9a2 2 0 1 1 0-4H3a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V2.9a2 2 0 1 1 4 0V3a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  );
}

export function ChevronLeftIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M15 19 8 12l7-7" />
    </svg>
  );
}

export function PlayIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function CheckIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export function PauseIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <rect x="6" y="5" width="4.5" height="14" rx="1.2" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1.2" />
    </svg>
  );
}

export function SkipBackIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M6 5a1 1 0 0 1 1 1v5.2l10.5-6.1a1 1 0 0 1 1.5.87v12.06a1 1 0 0 1-1.5.87L7 12.8V18a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function SkipForwardIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M18 5a1 1 0 0 0-1 1v5.2L6.5 5.1A1 1 0 0 0 5 6v12.06a1 1 0 0 0 1.5.87L17 12.8V18a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1Z" />
    </svg>
  );
}

export function MicIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M9 21h6" />
    </svg>
  );
}

export function KeyboardIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" />
    </svg>
  );
}

export function BackspaceIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M8.5 5h11a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-11L3 12l5.5-7Z" />
      <path d="m10.5 9.5 5 5m0-5-5 5" />
    </svg>
  );
}

export function PopcornIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M7 9 5.5 21h13L17 9" />
      <path d="M6.5 9a2.3 2.3 0 0 1-.7-4.5A2.6 2.6 0 0 1 8.5 2a2.6 2.6 0 0 1 4.7-1 2.6 2.6 0 0 1 4.4 1.6A2.3 2.3 0 0 1 17.5 9Z" />
      <path d="M10 9v12M14 9v12" />
    </svg>
  );
}

export function CloudSlashIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M3 3l18 18" />
      <path d="M9.5 6.2A5 5 0 0 1 18 10a4 4 0 0 1-.6 8H8m-3.4-2.6A4 4 0 0 1 6 8.1" />
    </svg>
  );
}

export function BinocularsIcon({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style}>
      <rect x="3" y="10" width="6" height="8" rx="2.5" />
      <rect x="15" y="10" width="6" height="8" rx="2.5" />
      <path d="M9 12h6M9.5 10 8 5.5a1.5 1.5 0 0 1 1.4-2h5.2a1.5 1.5 0 0 1 1.4 2L14.5 10" />
    </svg>
  );
}
