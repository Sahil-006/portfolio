import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-3xl px-5 pb-10 sm:px-8">
      <div className="flex flex-col gap-2 border-t border-rule pt-6 text-sm text-dim sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p>Trained, validated, then shipped.</p>
      </div>
    </footer>
  );
}
