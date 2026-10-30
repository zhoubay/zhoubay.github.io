# Xibin Zhou — Academic Homepage

Personal website: **[zhoubay.github.io](https://zhoubay.github.io)**

Ph.D. candidate in Computer Science at [Westlake University](https://www.westlake.edu.cn/) (joint with Zhejiang University). Research on **protein language models**, multimodal protein AI, and **AI for Science**.

## Site structure

| Path | Content |
|------|---------|
| `_pages/main.md` | Homepage (layout: `home`) |
| `_layouts/home.html` | Full-width hero + section includes |
| `_data/hero.yml`, `about.yml`, `interests.yml`, `news.yml`, `honors.yml`, `community_impact.yml` | Homepage content |
| `_data/scholar.json` | Homepage citation count, h-index, and last verified UTC date |
| `_data/selected_publications.yml` | Homepage featured paper slugs (references `_publications/`) |
| `_pages/research.md` | Research themes |
| `_data/research.yml` | Research sections and project slug references |
| `_pages/publications.html` | Full publication list |
| `_publications/` | Paper collection (front matter) |
| `_pages/cv.md` | CV |
| `_data/cv.yml` | Education, experience, skills |
| `_pages/talks.html` | Talks |
| `_pages/blog.html` | Blog post list |
| `_posts/` | Blog posts (`YYYY-MM-DD-slug.md`; `categories: [blog]`) |
| `_includes/pub-card.html` | Shared publication card component |
| `_includes/render-pub-card.html` | Maps a `_publications` doc to `pub-card` (optional field overrides) |
| `_includes/render-pub-card-by-slug.html` | Resolves slug via `resolve-publication` then renders a card |
| `_includes/link-buttons.html` | Shared external link buttons (cards, detail hero, impact) |
| `_includes/format-authors.html` | Renders `**name**` author bold markup |
| `_includes/resolve-publication.html` | Looks up `site.publications` by `slug` (sets `resolved_publication`, `resolved_found`) |
| `assets/js/site-reveal.js` | Scroll reveal animations |
| `_config.yml` | Site-wide settings |

## Editing content

- **Math formulas**: add `math: true` to a page's front matter to load MathJax on that page only. Use Kramdown inline math with `$$...$$` (e.g. `$$K_{cat}$$`); do not use `\(...\)` — Kramdown treats `\(` as an escaped parenthesis.
- **News**: add entries to `_data/news.yml` (`date`, `text` in Markdown).
- **Honors**: `_data/honors.yml`.
- **Sports Awards**: `_data/sports_awards.yml` supplies the homepage gallery and the CV's Sports Awards section. Keep the downloadable CV in `latex_files/cv/main.tex` in sync and recompile `main.pdf` when adding awards.
- **Community Impact**: `_data/community_impact.yml` (title, description, badge, links with `label` / `url` / `icon`). Screenshots in `files/evidence/`. Rendered on homepage and `/cv/` via `_includes/community-impact-section.html`.
- **New blog post**: add `_posts/YYYY-MM-DD-slug.md` with `title`, `subtitle_zh` / `subtitle_en`, `date`, `categories: [blog]`, optional `series`, `math: true`, `toc: true`. Listed at `/blog/`; add `slug` to nav via `_data/navigation.yml` (Blog entry).
- **New paper**: add `_publications/YYYY-MM-DD-slug.md` with `slug`, `venue`, `badge`, `journal_tag`, `summary`, `authors`, `links`, `paperurl`, `citation`, etc. Optional `bibtex: |` block enables **Copy BibTeX** on the publication page; **Copy citation** is always available when `citation` is set.
- **Cartoon illustration** (optional): `cartoon_webp`, `cartoon_fallback` (JPEG), and `cartoon_alt` in front matter show on homepage/research cards and the publication detail page; use optimized WebP/JPEG in `images/` and keep original PNGs as source files.
- **Privacy policy**: edit [`_pages/terms.md`](_pages/terms.md) (published at `/terms/`; `/privacy/` redirects there). Footer links to this page; GA4 disclosure is described there.
- **Homepage featured papers**: add the `slug` to `_data/selected_publications.yml` (`slugs` list; order = display order).
- **Research page projects**: add `slug` under the right section in `_data/research.yml` (`name` / `summary` / `badge` optional overrides).

### Google Scholar metrics

The homepage renders `Total citations` and `h-index` from `_data/scholar.json` at build time. The initial snapshot (909 citations, h-index 7, checked 2026-10-29) was supplied by the site owner. The source link uses `author.googlescholar` in `_config.yml`. Visitors make no requests to Scholar, and the metrics remain visible without JavaScript.

For manual updates, edit `citations`, `h_index`, and `updated_at` (the date the values were verified, `YYYY-MM-DD` in UTC). Use the **All** column on the Scholar profile. Missing data hides the metrics block rather than showing a false zero.

To check the automatic updater locally:

```bash
python3 -m pip install -r scripts/requirements-scholar.txt
python3 -m unittest discover -s tests -p 'test_update_scholar.py'
python3 scripts/update_scholar.py --output /tmp/scholar-preview.json
```

Omit `--output` to update the tracked snapshot. The updater makes one direct profile request with a 20-second timeout, no retries, and no proxies. It reads the English **All** column and replaces the snapshot only after both values validate. Legitimate zeroes and decreases are accepted. HTTP errors, challenges, timeouts, malformed data, and write failures leave the previous values and verification date unchanged. Free profile fetching can remain blocked by Scholar; a completed workflow setup alone does not prove live updates work.

### Homepage after-hours easter egg

The homepage's bilingual **Off the clock / 下班了** button opens a small lake with paper boats named after the featured publications. Move or tap on the water for ripples, click a boat to nudge it, and use **Back to shore / 回岸上** or **Esc** to return to the same scroll position. It runs entirely in the browser without services or extra dependencies, and never opens automatically. On entry, a note from the boss (老板 / PI) asks for one more experiment, then the rising water carries it away. Reduced-motion preferences skip this animation and show the still lake with its departure message; without JavaScript the button stays hidden.

Markup lives in `_includes/after-hours.html`, styling in `_sass/_after-hours.scss`, and the animation in `assets/js/after-hours.js`. Boat names come from the publication slugs already used on the homepage. The scene, controls, boss dialogue, and boat-click messages show English with Chinese alongside; rotating messages are paired in the script.

### Publication slug resolution

`resolve-publication.html` sets global Liquid variables `resolved_publication` and `resolved_found`. Prefer `render-pub-card-by-slug.html` (resolve + render in one include) over calling `resolve-publication` and `pub-card` separately. Do not nest other includes between resolve and render on the same slug.

## Local preview

```bash
bundle install
bundle exec jekyll serve -l -H localhost
```

Open [http://localhost:4000](http://localhost:4000). Restart after editing `_config.yml`.

## Deploy

The `Pages` workflow in `.github/workflows/pages.yml` builds and publishes the site. During rollout, set **Settings → Pages → Build and deployment → Source → GitHub Actions**. The repository must allow the workflow to write contents and deploy to the `github-pages` environment from `master`.

- A push to `master` builds the existing snapshot without contacting Scholar. This also publishes the first, manually verified version of the metrics.
- Scheduled runs at **02:17 UTC** (10:17 Beijing time) and **08:43 UTC** (16:43 Beijing time, afternoon backup), or a manual run from the Actions tab, fetch Scholar first. Both schedules run independently; the afternoon run still runs if the morning run succeeds. A failed fetch stops the run; the current live site stays available with its original verification date. GitHub schedules can be delayed or dropped, so the second time reduces the risk of missing a day but does not guarantee an on-time run.
- After tests and a successful build, an update run commits only `_data/scholar.json` and deploys the built artifact in the same run. Values that remain unchanged still get a new verification date after a successful check. A `GITHUB_TOKEN` commit does not trigger another Pages build, so the explicit deployment is required.
- Publishing runs share one concurrency group. If `master` moves during the build, the workflow stops instead of force-pushing or knowingly publishing an obsolete checkout.

After enabling Actions publishing, first verify a normal push deployment, then manually run `Pages` to verify the full Scholar-fetch-to-live-page path. Check the Actions logs after failures; a 403 or challenge means Scholar rejected the request, not that citations became zero. To return to manual data maintenance, remove the workflow's `schedule` trigger and keep push deployment enabled. Public-repository schedules can be disabled after 60 days without repository activity; re-enable them in Actions when needed.

## Acknowledgement

Built with [Academic Pages](https://github.com/academicpages/academicpages.github.io) (Jekyll).
