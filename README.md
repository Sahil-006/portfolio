# Sahil Shaikh — Portfolio

Next.js 16 + Tailwind CSS 4 + Framer Motion + React Three Fiber. Three pages: Home, Projects, Favourites. Press ⌘K / Ctrl+K anywhere to search.

The home page is a scroll story: a see-through laptop that takes itself apart, one layer per chapter, then reassembles (with one screw left over).

| Layer | Chapter | Content comes from |
| --- | --- | --- |
| Screen | About | `site.about` in `data/site.ts` |
| Keyboard | Skills, one key per skill, coloured by group | `site.stack` |
| Motherboard | Projects, one chip per project (click to open) | first 5 in `data/projects.ts` |
| RAM | B.Tech, one stick per year, current year lit | `site.education[0].period` |
| Battery | Experience | `site.experience` |

The 3D laptop is in `components/laptop/Laptop.tsx`, the scroll story and text panels in `components/laptop/Teardown.tsx`, and the chapter list (including what the laptop screen says in each chapter) in `components/laptop/chapters.ts`. The sticky note text is in `Laptop.tsx`; search for `noteTexture`.

## Edit your content

Everything you'll want to change is in the `data/` folder. You don't need to touch any other code.

| File | What's in it |
| --- | --- |
| `data/site.ts` | Name, title, bio, links, status line, "Things I broke (and fixed)" stories, stack, experience, education, "On repeat" song |
| `data/projects.ts` | Projects, in display order (the first 3 appear on the home page). The first 5 become chips on the laptop's motherboard. |
| `data/favourites.ts` | Movies and series (**replace the placeholders before you deploy**) |

Images go in `public/`:
- Profile photo → `public/me.jpg`, then set `photo: "/me.jpg"` in `site.ts`
- Project screenshots → `public/projects/`, then set `image: "/projects/name.png"` on the project
- Posters → `public/favourites/`, then set `poster: "/favourites/name.jpg"`
- Resumes are in `public/resume/`. Replace the PDFs (keep the same file names) whenever you update them.

Any field left as `""` is hidden on the site.

## Run it on your computer

You need Node.js 20 or newer (https://nodejs.org).

```bash
npm install
npm run dev
```

Open http://localhost:3000. Changes show up as soon as you save a file.

## Deploy on Vercel (free)

1. Create a new **empty** repository on GitHub (e.g. `portfolio`).
2. In this folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/Sahil-006/portfolio.git
   git push -u origin main
   ```
3. Go to https://vercel.com, sign in with GitHub, click **Add New → Project**, pick the repo and click **Deploy**. No settings to change.
4. You get a URL like `portfolio-xyz.vercel.app`. Every `git push` redeploys automatically.

### Use your own domain
In Vercel: **Project → Settings → Domains → Add**, type your domain, and add the DNS records Vercel shows you at your domain registrar. Then set `url` in `data/site.ts` to your domain and push again.

## Updating an existing deployment

If the site is already on GitHub and Vercel, replace the project files with this version (keep your `.git` folder), then run:

```bash
npm install
git add -A
git commit -m "Teardown laptop redesign"
git push
```

Vercel redeploys automatically after the push.

## Notes
- The 3D scene picks a quality level for each visitor. Phones and weaker machines get a lighter version drawn at 30 fps, and any device switches to it automatically if its frame rate drops. Add `?quality=high` or `?quality=low` to the address to force one. Rendering pauses when the laptop is scrolled out of view or the tab is hidden.
- The 3D scene is loaded only in the browser, after the page itself has loaded. On devices without WebGL, the chapters show as a plain page. If a visitor has "reduce motion" turned on, the laptop doesn't sway and the lid starts open.
- The GitHub graph loads live from a public contributions API in the visitor's browser. If that API is down, the section shows a link to your GitHub profile instead.
- Your resumes include your phone number. Since they're public on the site, remove it from the PDFs if you'd rather not share it.
