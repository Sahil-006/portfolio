import type { Metadata } from "next";
import Image from "next/image";
import { favourites, favouritesIntro } from "@/data/favourites";

export const metadata: Metadata = { title: "Favourites" };

export default function FavouritesPage() {
  return (
    <div className="pt-12 sm:pt-16">
      <h1
        className="text-[clamp(2.5rem,8vw,4rem)] font-bold leading-none tracking-[-0.03em]"
        style={{ fontVariationSettings: '"wdth" 80' }}
      >
        Favourites
      </h1>
      <p className="mt-4 max-w-[55ch] text-lg leading-relaxed text-dim">{favouritesIntro}</p>

      {favourites.map((group) => (
        <section key={group.name} className="mt-14" aria-labelledby={`fav-${group.name}`}>
          <h2 id={`fav-${group.name}`} className="mb-6 text-xl font-semibold tracking-tight">
            {group.name}
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {group.items.map((item, i) => (
              <li key={item.title + i}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-rule bg-panel">
                  {item.poster ? (
                    <Image
                      src={item.poster}
                      alt={`${item.title} poster`}
                      fill
                      sizes="(min-width: 640px) 180px, 45vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col justify-end p-3">
                      <p
                        className="font-display text-xl font-semibold leading-tight text-ink"
                        style={{ fontVariationSettings: '"wdth" 85' }}
                      >
                        {item.title}
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-ink">
                  {item.title}
                  {item.year && <span className="text-dim">, {item.year}</span>}
                </p>
                {item.note && <p className="mt-0.5 text-sm leading-snug text-dim">{item.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
