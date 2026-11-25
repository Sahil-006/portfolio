# Sahil Shaikh — Portfolio

Next.js 16 + Tailwind CSS 4 + Framer Motion + React Three Fiber. Three pages: Home, Projects, Favourites. Press ⌘K / Ctrl+K anywhere to search.

The home page opens on a see-through handheld device built in 3D (React Three Fiber). Its circuit board is visible through the clear case:
- each **chip** is one of your first five projects (click one to open it),
- the **LED strip** under the screen shows your last 7 days of GitHub activity, with today's LED blinking,
- **poke the case** and the parts pop out ("oops."), then snap back together ("fixed.").

Everything on it comes from `data/`: chip names and numbers from `data/projects.ts`, LED colours from each project's `hue`. The screen text and sticky note are in `components/device/Device.tsx` (search for `screenTexture` and `noteTexture`).

## Edit your content

Everything you'll want to change is in the `data/` folder. You don't need to touch any other code.

| File | What's in it |
| --- | --- |
| `data/site.ts` | Name, title, bio, links, status line, "Things I broke (and fixed)" stories, stack, experience, education, "On repeat" song |
| `data/projects.ts` | Projects, in display order (the first 3 appear on the home page). The first 5 become chips on the 3D device. |
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
git commit -m "Clear-case device redesign"
git push
```

Vercel redeploys automatically after the push.

## Notes
- The 3D scene picks a quality level for each visitor. Desktops get real refracting plastic. Phones and weaker machines get a lighter version of the case drawn at 30 fps, and any device switches to it automatically if its frame rate drops. Rendering also pauses when the hero is scrolled out of view or the tab is hidden.
- The 3D scene is loaded only in the browser, after the page itself has loaded. On devices without WebGL, visitors see soft colour glows and the rest of the page works as normal. If a visitor has "reduce motion" turned on, the scene stops rotating and floating.
- The GitHub graph loads live from a public contributions API in the visitor's browser. If that API is down, the section shows a link to your GitHub profile instead.
- Your resumes include your phone number. Since they're public on the site, remove it from the PDFs if you'd rather not share it.
