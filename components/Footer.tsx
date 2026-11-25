import { site } from "@/data/site";
import PixelBuddy from "./PixelBuddy";

export default function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-6xl px-5 pb-28 sm:px-8">
      <div className="flex items-end justify-between gap-4 border-t border-rule pt-6 text-sm text-dim">
        <div className="space-y-1">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p>Built, broken, fixed, shipped.</p>
        </div>
        <PixelBuddy />
      </div>
    </footer>
  );
}
