"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/parents/sources", label: "Sources" },
  { href: "/parents/approve", label: "Approve titles" },
  { href: "/parents/waiting", label: "Waiting" },
];

export default function ParentsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              background: active ? "var(--tv-surface)" : "transparent",
              color: active ? "var(--tv-text)" : "var(--tv-text-muted)",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
