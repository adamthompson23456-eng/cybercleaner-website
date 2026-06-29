# Auto-deploy: site updates itself when you change it

Right now you update the site by dragging `dist` onto Netlify. This connects Netlify
to GitHub so that **every change you push rebuilds and republishes automatically** —
no more dragging.

Your project is already a git repo with one commit, ready to push.

---

## Step 1 — Create an empty GitHub repo
1. Go to **https://github.com/new**
2. Repository name: **`cybercleaner-website`** (any name is fine)
3. Owner: **adamthompson23456-eng**
4. Set it **Public** (or Private — both work with Netlify).
5. ⚠️ Do **NOT** tick "Add a README", ".gitignore", or "license" — leave it empty.
6. Click **Create repository**.

## Step 2 — Push your code (run in PowerShell, in the website folder)
```
cd "C:\Users\abhis\OneDrive\Desktop\CyberCleanerPro_Web"
git branch -M main
git remote add origin https://github.com/adamthompson23456-eng/cybercleaner-website.git
git push -u origin main
```
If it asks you to sign in, a browser window opens — log into GitHub once and it remembers.

## Step 3 — Connect Netlify to the repo
1. Go to **https://app.netlify.com** → your **cybercleanernorton** site.
2. **Site configuration → Build & deploy → Continuous deployment → Link repository**
   (or, simpler, create a new site: **Add new site → Import an existing project → GitHub**).
3. Pick the **cybercleaner-website** repo.
4. Netlify auto-reads `netlify.toml`, so the settings are already filled:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy**.

Done. From now on:
```
# make your edits, then:
git add -A
git commit -m "what I changed"
git push
```
…and the live site rebuilds itself in about a minute.

> Tip: if you linked the repo to a *new* Netlify site, you can move the
> `cybercleanernorton` name to it under **Domain management → Edit site name**
> (free names must be unique, so rename the old site first).
