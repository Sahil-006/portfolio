# Sahil Shaikh — Portfolio

Next.js 16 + Tailwind CSS 4 + Framer Motion. Three pages: Home, Projects, Favourites. Press ⌘K / Ctrl+K anywhere to search.

## Edit your content

Everything you'll want to change is in the `data/` folder. You don't need to touch any other code.

| File | What's in it |
| --- | --- |
| `data/site.ts` | Name, title, bio, links, status line, stack, experience, education, "On repeat" song |
| `data/projects.ts` | Projects, in display order (the first 3 appear on the home page) |
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

## Notes
- The GitHub graph loads live from a public contributions API in the visitor's browser. If that API is down, the section shows a link to your GitHub profile instead.
- Your resumes include your phone number. Since they're public on the site, remove it from the PDFs if you'd rather not share it.
