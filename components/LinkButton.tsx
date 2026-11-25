export default function LinkButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const external = href.startsWith("http") || href.endsWith(".pdf");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-colors ${
        primary
          ? "border-signal/40 bg-signal/10 text-signal hover:bg-signal/20"
          : "border-rule text-ink hover:border-dim"
      }`}
    >
      {children}
    </a>
  );
}
