"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/data/site";
import CommandPalette, { useCommandPalette } from "./CommandPalette";

const nav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/favourites", label: "Favourites" },
];

export default function Header() {
  const pathname = usePathname();
  const palette = useCommandPalette();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ground/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          aria-label={`${site.name}, home`}
          className="font-display text-lg font-bold tracking-tight text-ink"
        >
          {site.initials}
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 transition-colors ${
                  active ? "text-ink" : "text-dim hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => palette.setOpen(true)}
            className="ml-1 flex items-center gap-2 rounded-md border border-rule px-2.5 py-1.5 text-dim transition-colors hover:border-dim hover:text-ink"
            aria-label="Search the site"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <kbd className="hidden font-body text-xs sm:inline">⌘K</kbd>
          </button>
        </nav>
      </div>
      <CommandPalette open={palette.open} setOpen={palette.setOpen} />
    </header>
  );
}
