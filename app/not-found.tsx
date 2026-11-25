import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-24">
      <h1 className="text-4xl font-bold tracking-tight">Flatline.</h1>
      <p className="mt-3 text-dim">This page doesn’t exist.</p>
      <Link href="/" className="mt-6 inline-block text-ink underline underline-offset-4">
        Go to the home page
      </Link>
    </div>
  );
}
