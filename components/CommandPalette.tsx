"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { projects } from "@/data/projects";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export default function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const go = (href: string) => {
    setOpen(false);
    if (href.startsWith("http") || href.startsWith("mailto:") || href.endsWith(".pdf")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.links.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      go(`mailto:${site.links.email}`);
    }
  };

  const socials = [
    { label: "GitHub", href: site.links.github },
    { label: "LinkedIn", href: site.links.linkedin },
    { label: "X", href: site.links.x },
  ].filter((s) => s.href);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Search the site">
      <Command.Input placeholder="Search pages, projects and links" />
      <Command.List>
        <Command.Empty>Nothing matches that. Try a project name.</Command.Empty>

        <Command.Group heading="Pages">
          <Command.Item onSelect={() => go("/")}>Home</Command.Item>
          <Command.Item onSelect={() => go("/projects")}>Projects</Command.Item>
          <Command.Item onSelect={() => go("/favourites")}>Favourites</Command.Item>
        </Command.Group>

        <Command.Group heading="Projects">
          {projects.map((p) => (
            <Command.Item
              key={p.slug}
              value={`${p.name} ${p.tags.join(" ")}`}
              onSelect={() => go(`/projects#${p.slug}`)}
            >
              {p.name}
              <span className="text-xs text-dim">{p.tags.slice(0, 2).join(", ")}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Contact and resume">
          <Command.Item onSelect={copyEmail} value="copy email address">
            {copied ? "Email copied" : "Copy email address"}
            <span className="text-xs text-dim">{site.links.email}</span>
          </Command.Item>
          {site.resumes.map((r) => (
            <Command.Item key={r.href} onSelect={() => go(r.href)}>
              Open {r.label}
            </Command.Item>
          ))}
          {socials.map((s) => (
            <Command.Item key={s.label} onSelect={() => go(s.href)}>
              {s.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
