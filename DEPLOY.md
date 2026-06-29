# Putting the CyberCleaner Pro website online

Your finished website is the **`dist`** folder (already built). Pick ONE option below.

---

## ⭐ Option A — Netlify Drop (easiest, no account needed to test)
Best if you're not technical. No commands, just drag-and-drop.

1. First build the latest version (only needed after changes):
   - Open PowerShell in this folder and run: `npm run build`
2. Open **https://app.netlify.com/drop** in your browser.
3. Open this folder in File Explorer:
   `C:\Users\abhis\OneDrive\Desktop\CyberCleanerPro_Web`
4. **Drag the `dist` folder** onto the Netlify page.
5. Wait a few seconds — you get a live URL like `https://random-name.netlify.app`.
6. (Optional) Make a free account to keep the URL and rename it
   (e.g. `cybercleanerpro.netlify.app`).

To update the site later: run `npm run build` again, then drag the new `dist` folder.

---

## Option B — Vercel (free account, auto-rebuilds from GitHub)
1. Push this project folder to a GitHub repo.
2. Go to **https://vercel.com**, sign in with GitHub, click **Add New → Project**.
3. Pick the repo. Vercel reads `vercel.json` automatically — just click **Deploy**.
4. You get a `https://<name>.vercel.app` URL. Every push auto-updates the site.

---

## Option C — GitHub Pages (free, uses your GitHub)
1. Create a new repo on GitHub (e.g. `cybercleaner-site`).
2. In this folder run:
   ```
   npm run build
   cd dist
   git init
   git add .
   git commit -m "Deploy CyberCleaner Pro site"
   git branch -M gh-pages
   git remote add origin https://github.com/adamthompson23456-eng/cybercleaner-site.git
   git push -f origin gh-pages
   ```
3. On GitHub: repo **Settings → Pages → Branch = gh-pages → Save**.
4. Your site appears at
   `https://adamthompson23456-eng.github.io/cybercleaner-site/`
   (relative paths are already configured, so it works on this sub-path).

---

## Custom domain (e.g. www.cybercleanerpro.com)
1. Buy the domain (Namecheap, GoDaddy, Cloudflare, etc.).
2. In Netlify/Vercel: **Domain settings → Add custom domain** → follow the DNS steps
   (add the records they show at your domain registrar).
3. HTTPS is added automatically and free.

---

## Note about the EXE download
The "Download for Windows" buttons point to your real EXE on GitHub:
`https://raw.githubusercontent.com/adamthompson23456-eng/CybercleanerPro/main/CyberCleanerPro_AI_Pro.exe`
That keeps working from any host above. To change it, edit the top of `src/App.jsx`
(`DOWNLOAD_URL`) and rebuild.
