export default function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mt-16 sm:mt-20" aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined} className="mb-6 text-xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}
