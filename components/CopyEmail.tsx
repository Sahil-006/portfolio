"use client";

import { useState } from "react";
import { site } from "@/data/site";

// Copies the email address with one click. If the browser blocks clipboard access,
// it opens the visitor's mail app instead.
export default function CopyEmail({ primary = false, label = "Say hi" }: { primary?: boolean; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!site.links.email) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.links.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${site.links.email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      title={site.links.email}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
        primary
          ? "border-signal/40 bg-signal/10 text-signal hover:bg-signal/20"
          : "border-rule text-ink hover:border-dim"
      }`}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3.5 6.5 8.5 6 8.5-6" />
        </svg>
      )}
      {copied ? "Email copied" : label}
    </button>
  );
}
