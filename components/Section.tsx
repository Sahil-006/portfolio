// On wide screens the title sits in its own left column and stays in view while you scroll
// through the section. On phones it's a normal heading above the content.
export default function Section({
  title,
  note,
  children,
  id,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      className="mt-16 scroll-mt-10 sm:mt-20 lg:mt-28 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12"
      aria-labelledby={titleId}
    >
      <div className="mb-6 lg:sticky lg:top-10 lg:mb-0 lg:self-start">
        <h2 id={titleId} className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {note && <p className="mt-2 hidden max-w-[24ch] text-sm leading-relaxed text-dim lg:block">{note}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
