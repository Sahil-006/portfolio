// ─────────────────────────────────────────────────────────────
// Your favourites, shown as clear game cartridges.
//
// tint:  the colour of the cartridge plastic.
// note:  optional, your own line about it (why you love it, a moment that stuck).
//        It appears on the little screen when someone inserts the cartridge.
// Add or remove whole groups as you like (games, books, albums...).
// ─────────────────────────────────────────────────────────────

export type Favourite = {
  title: string;
  year: string;
  by: string; // director / creator / studio
  tint: string;
  note?: string;
};
export type FavouriteGroup = { name: string; kind: string; items: Favourite[] };

export const favouritesIntro = "Movies, series and anime I keep coming back to. Pick a cartridge.";

export const favourites: FavouriteGroup[] = [
  {
    name: "Movies",
    kind: "movie",
    items: [
      { title: "Interstellar", year: "2014", by: "dir. Christopher Nolan", tint: "#8ab4ff" },
      { title: "Tenet", year: "2020", by: "dir. Christopher Nolan", tint: "#ff6b7a" },
      { title: "Prisoners", year: "2013", by: "dir. Denis Villeneuve", tint: "#a3adb8" },
      { title: "Fight Club", year: "1999", by: "dir. David Fincher", tint: "#ff8fc0" },
    ],
  },
  {
    name: "Series",
    kind: "series",
    items: [
      { title: "Chernobyl", year: "2019", by: "created by Craig Mazin", tint: "#c7e86b" },
      { title: "True Detective", year: "2014, season 1", by: "created by Nic Pizzolatto", tint: "#f0b35b" },
      { title: "Peaky Blinders", year: "2013–2022", by: "created by Steven Knight", tint: "#b8a48a" },
      { title: "Dark", year: "2017–2020", by: "created by Baran bo Odar & Jantje Friese", tint: "#f2d24b" },
    ],
  },
  {
    name: "Anime",
    kind: "anime",
    items: [
      { title: "Vinland Saga", year: "2019–", by: "from the manga by Makoto Yukimura", tint: "#5eead4" },
      { title: "One Piece", year: "1999–", by: "from the manga by Eiichiro Oda", tint: "#ff7a59" },
      { title: "Attack on Titan", year: "2013–2023", by: "from the manga by Hajime Isayama", tint: "#86c06c" },
      { title: "Death Note", year: "2006–2007", by: "from the manga by Tsugumi Ohba & Takeshi Obata", tint: "#a78bfa" },
    ],
  },
];
