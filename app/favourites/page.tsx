import type { Metadata } from "next";
import "@fontsource/ibm-plex-mono/500.css";
import { favouritesIntro } from "@/data/favourites";
import FavouritesConsole from "@/components/FavouritesConsole";

export const metadata: Metadata = { title: "Favourites" };

export default function FavouritesPage() {
  return (
    <div className="mx-auto max-w-4xl pt-16 sm:pt-24">
      <h1
        className="text-[clamp(2.5rem,8vw,4rem)] font-bold leading-none tracking-[-0.03em]"
        style={{ fontVariationSettings: '"wdth" 80' }}
      >
        Favourites
      </h1>
      <p className="mt-4 max-w-[55ch] text-lg leading-relaxed text-dim">{favouritesIntro}</p>
      <FavouritesConsole />
    </div>
  );
}
