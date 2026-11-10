# Raoyuan Zhao — Academic Homepage

Personal academic website of Raoyuan Zhao, PhD student in Natural Language Processing at LMU Munich (MaiNLP, MCML).

The site is built on [PRISM](https://github.com/xyjoey/PRISM) (Next.js, TypeScript, Tailwind CSS, TOML/BibTeX content, static export) and its visual design is inspired by the [Luka Homepage Template](https://github.com/wzsyyh/luka-homepage-template) by Yuheng Yang (warm minimalist palette, left profile sidebar, section headings, timeline, visitor map card). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for licenses.

- **Content lives in `content/`.** You rarely need to touch `src/`.
- **Pages:** About (homepage), Publications, Experience, Talks, Teaching, CV, plus a Privacy page linked from the footer and the visitor map.
- **Output:** a fully static site in `out/` that can be hosted anywhere (GitHub Pages, Cloudflare Pages, a university web server, …).

---

## Quick start

Requires Node.js 20 or newer (22 recommended).

```bash
npm install
npm run dev        # http://localhost:3000, reloads on content changes
```

Production build and local preview of the exported site:

```bash
npm run build      # writes the static site to out/
npx serve out      # or: cd out && python3 -m http.server 4173
```

`npm run lint` runs ESLint. The build downloads the Inter font from Google Fonts once and self-hosts it, so visitors never contact Google; it therefore needs network access.

---

## Editing content

| What | File |
| --- | --- |
| Name, title, photo, affiliations, social links, CV path, SEO, visitor map | `content/config.toml` |
| Biography ("About Me") | `content/bio.md` |
| Homepage sections and research interests | `content/about.toml` |
| News | `content/news.toml` |
| Publications | `content/publications.bib` |
| Research experience and education | `content/experience.toml` |
| Talks | `content/talks.toml` |
| Teaching | `content/teaching.toml` |
| CV page | `content/cv.toml`, `public/cv/` |
| Privacy notice | `content/privacy.md` |

Restart `npm run dev` after editing `config.toml`; the other files reload automatically.

### Biography

Edit `content/bio.md` (Markdown). Links open in a new tab; use `**bold**` for emphasis.

### Profile photo

1. Save a square image (at least 440×440 px) as `public/profile.jpg`. It is shown as a rounded square that enlarges slightly on hover.
2. For another file name or format, change `avatar` under `[author]` in `content/config.toml`, e.g. `avatar = "/profile.png"`.
3. Keep `public/avatar-placeholder.svg`: it is shown whenever the photo file is missing.

### Email and social links

Fill in the fields under `[social]` in `content/config.toml`. Empty values hide the icon. The email address is shown in an obfuscated form (`name [at] domain [dot] org`) and as a `mailto:` button.

### Research interests

`content/about.toml` → `[profile]` → `research_interests` lists the tags, shown in that order with equal styling.

### News

Add a new `[[news]]` block at the **top** of `content/news.toml`:

```toml
[[news]]
date = "Mar 2027"      # or just "2027" if the month is unknown
content = "Our paper [Title](https://…) was accepted at ACL 2027."
```

The homepage shows the newest five; the rest are behind "Show more". Change `limit` in the `news` section of `content/about.toml` to adjust.

### Publications

`content/publications.bib` is the single source of truth. For accepted papers, paste the official BibTeX from the [ACL Anthology](https://aclanthology.org/people/raoyuan-zhao/); for preprints, use the arXiv "Export BibTeX Citation". Then add any of these website-only fields (they are stripped from the BibTeX shown to visitors):

```bibtex
  selected = {true},                 % show under "Selected Publications" on the homepage
  venue    = {ACL 2027 (Main)},      % short label; preprints default to "Preprint"
  pdf      = {https://…pdf},
  arxiv    = {2605.09548},           % adds an arXiv button to a published paper
  code     = {https://github.com/…},
  project  = {https://…},
  abstract = {…},
  preview  = {figure.png},           % optional thumbnail from public/papers/
```

Entries are sorted by year and month automatically. The Publications page provides search (title, authors, venue), year and type filters, abstract and BibTeX toggles with copy-to-clipboard, and highlights your own name (matched against `[author] name`). Author lists longer than ten names are truncated with a "+N more authors" toggle. LaTeX accents such as `K{\"o}ksal` are rendered correctly.

The number of selected papers on the homepage is set by `limit` in the `selected-publications` section of `content/about.toml` (currently 5).

### Experience and education

`content/experience.toml`: each `[[items]]` block has a `category` ("Research Experience" or "Education"), `title`, `subtitle` (organisation), `date`, `location`, optional `details` (lines of Markdown), `content` (paragraph), `link`, and `links`. Set `hidden = true` to keep an entry in the file without showing it. These entries are shown on the CV page.

### Talks

Copy the commented template at the top of `content/talks.toml`. Talks are grouped into **Invited Talks**, **Research Seminars**, and **Conference Presentations**; empty groups are not shown. Add slides and video as `links = [{ label = "Slides", url = "…" }, { label = "Video", url = "…" }]`. The homepage shows the three most recent talks.

### Teaching

`content/teaching.toml` follows the same format. `status = "Upcoming"` shows a badge; remove it once the course has started. Put the confirmed role into `details`, e.g. `details = ["Role: Teaching assistant"]`.

### CV

1. Export your CV as PDF and save it as `public/cv/Raoyuan_Zhao_CV.pdf` (or change `cv` in `[social]` and `pdf` in `content/cv.toml`).
2. Rebuild. The "Download CV" button and the CV icon in the sidebar become active automatically; until the file exists the button is shown as disabled ("PDF coming soon").

The CV page is generated from `content/experience.toml` (Education and Research Experience). Edit the section order in `content/cv.toml`.

### Site URL and SEO

Once you know the final address, set `url` under `[site]` (e.g. `"https://raoyuanzhao.github.io"`). This enables canonical URLs, Open Graph URLs, and a populated `sitemap.xml`/`robots.txt`. Each page also gets a description, and the homepage embeds schema.org `Person` metadata.

Also update `last_updated` under `[site]` when you make significant changes.

### Colours

All colours are defined at the top of `src/app/globals.css`. The seven brand colours (`--palette-*`: cream, card, beige, charcoal, coral, lavender, pine) are set once. Components only use semantic tokens (Tailwind classes in brackets):

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--accent` (`accent`) | `#FF7759` coral | same | Underlines, timeline dots and lines, active-nav bar, hover fills, publication border |
| `--accent-ink` (`accent-ink`) | `#C2452A` | `#FF8A70` | Coral text: active nav, dates, selected tags, button labels |
| `--accent-strong` (`accent-strong`) | `#EE5B3C` | `#FF7759` | Social icons, focus ring |
| `--primary` (`primary`) | `#315548` pine | `#9DC7B5` | Name, headings, titles, important buttons |
| `--secondary` / `--secondary-ink` | `#C78DDA` / `#8C4FA3` | `#C78DDA` / `#D6A6E5` | Lavender tag borders / links and venues |

The `-ink` and `-strong` shades keep the brand hues but are dark enough for readable text (4.5:1) and icons (3:1) on the cream background; the pure coral and lavender are used for lines, dots, and fills. The visitor map colours are set separately in `[visitor_map.light]`/`[visitor_map.dark]` in `content/config.toml`.

---

## Visitor map

A compact "Visitor map" card sits directly below the profile and social links, in the sidebar on desktop and under the profile on phones. It shows:

- **Total Visits** in the top-right corner of the card: the provider's all-time total, which also counts visits whose country could not be determined;
- a self-hosted world map (`public/world-map.svg`) with one translucent coral dot per country that visitors came from, placed at the country's label point (Natural Earth) and sized by the square root of its visits relative to the busiest country. Hovering (or tapping) near a dot shows a tooltip with flag, country name, and count; keyboard users can tab to the map and step through the countries with the arrow keys;
- 🏆 **Most Visits** and 💎 **Rarest Visitor** (the country with the fewest visits; ties are broken alphabetically), each with flag, country name, and count;
- the number of countries, and when the figures were last updated.

The total and the per-country counts come from the same provider, for the same period (all time), and in the same unit (GoatCounter: first visit of a session, bots excluded; Umami: visits, or unique visitors on old versions). The fetch step fails if the total is ever lower than the sum of the countries.

Until visits have been recorded it shows only the map with "No visits recorded yet." (or "Live visitor statistics are not enabled yet." while no provider is configured).

### How it works

GitHub Pages only serves static files, so the statistics are fetched **at build time**, not in the visitor's browser:

1. A cookieless counter script (GoatCounter or Umami) records page views on the deployed site. It is only loaded on the address set as `url` under `[site]` (not on local previews), and not at all for browsers that send Do Not Track or Global Privacy Control. Query strings and URL fragments are never sent.
2. `npm run stats` (`scripts/fetch-visitor-stats.mjs`) asks the provider's API for all-time visits per country and the all-time total, and writes `.generated/visitor-stats.json` (country codes and counts only), and copies the flags of those countries from [flag-icons](https://flagicons.lipis.dev/) to `public/flags/`. Both are generated files and are not committed.
3. `npm run build` reads the file and renders the card into the static pages.

The GitHub Actions workflow runs these steps on every push and **every 6 hours**, so the card refreshes automatically. The API credential is a GitHub Actions secret that only the "Fetch visitor statistics" step can read; it never reaches the build output or the browser. If a configured provider cannot be reached, the workflow stops before deploying, so the currently live statistics stay in place. (GitHub pauses scheduled workflows in public repositories after 60 days without commits; re-enable it in the Actions tab if that happens.)

### Setup with GoatCounter (free)

1. Create an account at [goatcounter.com](https://www.goatcounter.com/). The code you choose becomes `https://<code>.goatcounter.com`.
2. Set `code = "<code>"` under `[visitor_map.goatcounter]` in `content/config.toml` (keep `provider = "goatcounter"`).
3. Optional: in GoatCounter's site settings, switch off the data you don't need (for example region or screen size). Keep country and sessions enabled, which the map relies on.
4. In GoatCounter, open **User → API**, create a token with only the **read statistics** permission, and add it to the GitHub repository as the secret `GOATCOUNTER_API_TOKEN` (**Settings → Secrets and variables → Actions → New repository secret**).
5. Push. The next workflow run fetches the statistics. GoatCounter counts a visit once per session of a few hours.

### Setup with Umami

Umami Cloud includes API access only on paid plans (Pro and above; the free Hobby plan has no API). A self-hosted Umami instance works on any plan.

1. Add the website in Umami and copy its **Website ID** to `website_id` under `[visitor_map.umami]`, and set `provider = "umami"`.
2. Credentials (GitHub Actions secrets):
   - Umami Cloud: create a key under **Settings → API keys** and save it as `UMAMI_API_KEY`.
   - Self-hosted: set `script_url = "https://<your-umami-host>/script.js"` and `api_url = "https://<your-umami-host>/api"`, and save the login of a dedicated view-only user as `UMAMI_USERNAME` and `UMAMI_PASSWORD`.
3. Replace the GoatCounter paragraphs in `content/privacy.md` with a description of Umami (it also uses no cookies and does not store IP addresses; it derives the country from the IP address and identifies sessions with a salted hash that rotates monthly).
4. Push. Visits are taken from Umami's per-country `visits` metric; older self-hosted versions without it fall back to unique visitors, and the card then says "visitors".

### Local preview with real data

```bash
export GOATCOUNTER_API_TOKEN=…   # or UMAMI_API_KEY; type it in your shell, never commit it
npm run stats && npm run build
```

### Options (`[visitor_map]` in `content/config.toml`)

| Key | Values |
| --- | --- |
| `enabled` | `true` / `false` (hides the card and loads no counter) |
| `provider` | `"goatcounter"` (default) or `"umami"` |
| `title` | Card heading |
| `[visitor_map.goatcounter]` | `code` |
| `[visitor_map.umami]` | `website_id`, `script_url`, `api_url` |
| `[visitor_map.light]`, `[visitor_map.dark]` | `cl` land colour, `co` background (hex without `#`) |

### Privacy (GDPR / TDDDG)

Both providers are cookieless and store no IP addresses or cross-site identifiers, and the card itself only contains aggregated counts per country. The browser still sends the visitor's IP address to the provider with each page view (which is how the country is determined), so the Privacy page describes the processing and names legitimate interest (Art. 6(1)(f) GDPR) as the legal basis. Whether cookieless analytics needs consent under § 25 TDDDG is debated; if you want to be strict, only count visitors who agree, at the cost of under-counting.

Review `content/privacy.md` before publishing: add your contact details as the responsible person, and check whether you also need an Impressum (§ 5 DDG) for your situation. This is not legal advice; LMU's data protection office can help if the site is hosted or presented as part of your university role.

---

## Deployment

### GitHub Pages (recommended)

1. Create a repository named `<username>.github.io` and push this project to its `main` branch.
2. In the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. (Optional) Add the visitor statistics secret (see Visitor map above).
4. Push to `main` (or run the **Deploy homepage to GitHub Pages** workflow manually from the Actions tab). The workflow in `.github/workflows/deploy.yml` builds the site and publishes `out/`.
5. Set `url = "https://<username>.github.io"` in `content/config.toml` and push again.

Serving from a sub-path (`https://<username>.github.io/<repo>/`) is not configured out of the box: it requires `basePath`/`assetPrefix` in `next.config.ts` and prefixing the image and PDF paths in `content/`. Use a `<username>.github.io` repository or a custom domain instead.

### Other static hosts

Run `npm run build` and upload the contents of `out/` (Cloudflare Pages, Netlify, an LMU web space, …). Set the build command to `npm run build` and the output directory to `out` if the host builds for you.

---

## Project structure

```
content/                 all editable content (TOML, Markdown, BibTeX)
public/                  static files: photo, favicon, cv/, papers/ previews
src/app/                 Next.js routes, layout, SEO (sitemap, robots)
src/components/home/     sidebar profile, visitor map, homepage sections
src/components/pages/    page header, card/timeline lists, text and CV pages
src/components/publications/  publication list, entry, author list
src/lib/                 config loading, BibTeX parsing, section data
scripts/                 build-time helpers (visitor statistics)
```

The English-only site keeps PRISM's i18n machinery (disabled in `[i18n]`); see the PRISM documentation if you want to add a second language.

## License

Code: MIT, see [LICENSE](LICENSE) (PRISM) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) (Luka Homepage Template, fonts). The written content in `content/` and the photo are © Raoyuan Zhao.
