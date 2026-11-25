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

// Floating pill navigation, fixed to the bottom of the screen.
export default function Header() {
  const pathname = usePathname();
  const palette = useCommandPalette();

  return (
    <>
      <nav
        aria-label="Main"
        className="glass fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full !bg-[#141a24]/95 p-1.5 text-sm"
      >
        <Link
          href="/"
          aria-label={`${site.name}, home`}
          className="grid h-9 w-9 place-items-center rounded-full font-display text-sm font-bold text-ink"
        >
          {site.initials}
        </Link>
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 transition-colors ${
                active ? "bg-white/10 text-ink" : "text-dim hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => palette.setOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full text-dim transition-colors hover:bg-white/5 hover:text-ink"
          aria-label="Search the site (Ctrl+K)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </nav>
      <CommandPalette open={palette.open} setOpen={palette.setOpen} />
    </>
  );
}
