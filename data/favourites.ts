// ─────────────────────────────────────────────────────────────
// Your favourites. Replace the placeholders below with your own picks.
//
// poster: optional image, e.g. "/favourites/interstellar.jpg" (put the file in public/favourites/).
// Without a poster, the card shows the title in large type instead.
// Add or remove whole groups as you like (anime, games, albums...).
// ─────────────────────────────────────────────────────────────

export type Favourite = { title: string; year?: string; note?: string; poster?: string };
export type FavouriteGroup = { name: string; items: Favourite[] };

export const favouritesIntro =
  "Movies and series I keep coming back to.";

export const favourites: FavouriteGroup[] = [
  {
    name: "Movies",
    items: [
      { title: "Movie title", year: "Year", note: "One line on why you love it" },
      { title: "Movie title", year: "Year" },
      { title: "Movie title", year: "Year" },
      { title: "Movie title", year: "Year" },
    ],
  },
  {
    name: "Series",
    items: [
      { title: "Series title", year: "Year", note: "One line on why you love it" },
      { title: "Series title", year: "Year" },
      { title: "Series title", year: "Year" },
      { title: "Series title", year: "Year" },
    ],
  },
];
