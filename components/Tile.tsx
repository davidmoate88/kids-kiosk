import Link from "next/link";
import type { ReactNode } from "react";

export function Tile({
  href,
  emoji,
  label,
  colorVar,
  colorDarkVar,
  wide = false,
}: {
  href: string;
  emoji: string;
  label: string;
  colorVar: string;
  colorDarkVar: string;
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`tap-pop flex items-center justify-center gap-5 landscape:gap-3 rounded-[2.5rem] p-8 landscape:p-4 text-white shadow-lg ${
        wide ? "flex-row min-h-40 landscape:min-h-28" : "flex-col aspect-square landscape:aspect-auto"
      }`}
      style={{
        background: `linear-gradient(160deg, ${colorVar}, ${colorDarkVar})`,
      }}
    >
      <span className="text-7xl md:text-8xl landscape:text-5xl drop-shadow">{emoji}</span>
      <span className="text-3xl md:text-4xl landscape:text-xl font-extrabold text-center leading-tight drop-shadow">
        {label}
      </span>
    </Link>
  );
}

export function PageHeading({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 landscape:gap-1 pt-10 landscape:pt-4 pb-6 landscape:pb-3 px-4">
      <span className="text-6xl md:text-7xl landscape:text-4xl">{emoji}</span>
      <h1 className="text-4xl md:text-5xl landscape:text-3xl font-extrabold">{title}</h1>
      {subtitle && (
        <p className="text-foreground/60 text-xl md:text-2xl landscape:text-lg font-medium">{subtitle}</p>
      )}
    </div>
  );
}

export function BigButton({
  onClick,
  children,
  color = "var(--warm)",
  colorDark = "var(--warm-dark)",
  className = "",
}: {
  onClick?: () => void;
  children: ReactNode;
  color?: string;
  colorDark?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`tap-pop rounded-3xl px-10 py-6 landscape:px-6 landscape:py-4 text-3xl landscape:text-xl font-extrabold text-white shadow-lg ${className}`}
      style={{ background: `linear-gradient(160deg, ${color}, ${colorDark})` }}
    >
      {children}
    </button>
  );
}
