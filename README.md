# Static site — GitHub Pages setup

This workspace contains a small static site (index.html, style.css, main.js).

What I added to enable GitHub Pages automatic deploys:

- `.github/workflows/deploy.yml` — GitHub Actions workflow that copies the site files into `public/` and deploys to the `gh-pages` branch.
- `.nojekyll` — prevents Jekyll processing on GitHub Pages.
- `.gitignore` — common ignores.

How to publish (local steps):

1. Create a repository on GitHub (e.g. `USERNAME/REPO`).
2. In your local folder run:

```bash
git init
git add .
git commit -m "chore: initial site"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

3. After pushing, GitHub Actions will run and publish the site to the `gh-pages` branch. The Pages URL will be `https://USERNAME.github.io/REPO/`.

Notes:
- If you prefer a custom domain, add a `CNAME` file to the root or set it in repository settings.
- If `git commit` fails because your Git user isn't configured, run:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Local preview:

```bash
python -m http.server 8000
# or
npx serve .
```
