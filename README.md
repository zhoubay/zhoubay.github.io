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
| `_data/huggingface.json` | Cumulative model downloads and last successful check date |
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
- **Sports Awards**: `_data/sports_awards.yml` supplies the homepage gallery and the CV's Sports Awards section. Keep both downloadable CVs in `latex_files/cv/main.tex` and `latex_files/cv-zh/main.tex` in sync and recompile their `main.pdf` files when adding awards.
- **Community Impact**: `_data/community_impact.yml` (title, description, badge, links with `label` / `url` / `icon`). Screenshots in `files/evidence/`. Rendered on homepage and `/cv/` via `_includes/community-impact-section.html`. Cards with `huggingface_repo` read cumulative downloads from `_data/huggingface.json`.
- **New blog post**: add `_posts/YYYY-MM-DD-slug.md` with `title`, `subtitle_zh` / `subtitle_en`, `date`, `categories: [blog]`, optional `series`, `math: true`, `toc: true`. Listed at `/blog/`; add `slug` to nav via `_data/navigation.yml` (Blog entry).
- **New paper**: add `_publications/YYYY-MM-DD-slug.md` with `slug`, `venue`, `badge`, `journal_tag`, `summary`, `authors`, `links`, `paperurl`, `citation`, etc. Optional `bibtex: |` block enables **Copy BibTeX** on the publication page; **Copy citation** is always available when `citation` is set.
- **Cartoon illustration** (optional): `cartoon_webp`, `cartoon_fallback` (JPEG), and `cartoon_alt` in front matter show on homepage/research cards and the publication detail page; use optimized WebP/JPEG in `images/` and keep original PNGs as source files.
- **Privacy policy**: edit [`_pages/terms.md`](_pages/terms.md) (published at `/terms/`; `/privacy/` redirects there). Footer links to this page; GA4 disclosure is described there.
- **Homepage featured papers**: add the `slug` to `_data/selected_publications.yml` (`slugs` list; order = display order).
- **Research page projects**: add `slug` under the right section in `_data/research.yml` (`name` / `summary` / `badge` optional overrides).

### Downloadable CVs

The CV page offers English and Chinese PDF downloads, configured by `pdf` and `pdf_zh` in `_data/cv.yml`. Edit `latex_files/cv/main.tex` (English) and `latex_files/cv-zh/main.tex` (Chinese), keeping dates, publication status, and links in sync. The Chinese version retains English publication titles and uses the same portrait as the English version.

Compile with `bash latex_files/compile.sh cv` and `bash latex_files/compile.sh cv-zh` (XeLaTeX with Noto Serif CJK SC required). Check the compile logs for errors and use `pdfinfo` to confirm each generated `main.pdf` is exactly one A4 page before publishing. Commit both the source and rebuilt PDF for each changed version.

### Website analytics

The site keeps its existing Google Analytics 4 data stream (`G-HQ0RZENN0C`) and supports optional Baidu Tongji alongside it. Analytics scripts load only when `JEKYLL_ENV=production`; normal local previews do not report visits. The existing `analytics.provider` switch controls both services, and `analytics: false` in a page's front matter disables both on that page.

To enable Baidu:

1. Sign in to [Baidu Tongji](https://tongji.baidu.com/), add `https://zhoubay.github.io`, and obtain the site's official asynchronous tracking code. Confirm that Baidu accepts the domain before proceeding.
2. Copy only the public site ID after `https://hm.baidu.com/hm.js?` into `analytics.baidu.tracking_id` in the configuration below. Keep it quoted. This ID is intended to be public; do not put account passwords, API tokens, or OAuth credentials in the repository. An empty ID leaves Baidu disabled.
3. Build and publish through the existing Pages workflow, which already sets `JEKYLL_ENV=production`. The privacy page includes the Baidu disclosure automatically when Baidu is configured and analytics is enabled.
4. Open the published homepage and a content page. Confirm that both services load once and that each dashboard actually receives visits. Successful script downloads alone do not prove data collection.

Configuration:

```text
/zhouxibin/workspaces/zhoubay.github.io/_config.yml
```

Use a tagged link such as `https://zhoubay.github.io/?utm_source=analytics_trial&utm_medium=referral&utm_campaign=dual_analytics` for a controlled source check, and verify attribution in both dashboards after processing. For other channels, use distinct links for newsletter articles, shared messages, and conference QR codes; retained tags identify the original labeled link, not its complete forwarding history. Baidu also provides a [tracking URL builder](https://tongji.baidu.com/web/help/article?id=224&type=0).

Compare the first seven days using matching date ranges and time zones. Do not add the two services' counts together: visits overlap, definitions differ, and blockers or network failures can affect collection. Ordinary reports may lag behind real-time reports. Clearing `analytics.baidu.tracking_id` and republishing disables Baidu while retaining GA4. A separate dashboard page is deferred until collection is verified.

### Google Scholar metrics

The homepage renders `Total citations` and `h-index` from `_data/scholar.json` at build time. The initial snapshot (909 citations, h-index 7, checked 2026-10-29) was supplied by the site owner. The source link uses `author.googlescholar` in `_config.yml`. Visitors make no requests to Scholar, and the metrics remain visible without JavaScript.

For manual updates, edit `citations`, `h_index`, and `updated_at` (the date the values were verified, `YYYY-MM-DD` in UTC). Use the **All** column on the Scholar profile. Missing data hides the metrics block rather than showing a false zero.

Automatic updates use the [SearchApi Google Scholar Author API](https://www.searchapi.io/docs/google-scholar-author). In **Settings → Secrets and variables → Actions → New repository secret**, save the SearchApi key as `SEARCHAPI_API_KEY`. The key is injected only into the refresh step; do not add it to source files or `_config.yml`.

To check the automatic updater locally:

```bash
python3 -m pip install -r scripts/requirements-scholar.txt
python3 -m unittest discover -s tests -p 'test_update_scholar.py'
read -rsp 'SearchApi API Key: ' SEARCHAPI_API_KEY; printf '\n'
export SEARCHAPI_API_KEY
python3 scripts/update_scholar.py --output /tmp/scholar-preview.json
unset SEARCHAPI_API_KEY
```

Omit `--output` to update the tracked snapshot. The updater makes one SearchApi request with a 110-second timeout, no retries, redirects, or proxies. Authentication uses a Bearer header. It verifies the returned author ID and success status, then reads the English **All** column and replaces the snapshot only after both values validate. Legitimate zeroes and decreases are accepted. The verification date comes from the response creation time, converted to UTC, so a cached response is not relabeled with today’s date. Missing keys, HTTP errors, exhausted quotas, timeouts, malformed data, and write failures leave the previous values and date unchanged. There is no fallback to direct Scholar scraping or another citation database.

Automatic refreshes run when the last successful snapshot is at least three UTC calendar days old, using about 10 API requests per month when updates succeed. A daily check that is not yet due makes no SearchApi request; the build and deployment are skipped when neither Scholar nor Hugging Face is due. Failed refreshes are eligible again at the next daily check; manual runs always request an update and consume one additional request. SearchApi’s signup trial is a finite allowance, not a guaranteed monthly free plan. Monitor the quota in its dashboard; a 429 response requires checking the quota or rate limit.

### Hugging Face cumulative downloads

The Evolla and SaProt cards on the homepage and `/cv/` use fixed headlines ("over 1M total Hugging Face downloads" and "over 1.4M total Hugging Face downloads") with a centered cumulative count from `_data/huggingface.json`, styled like the citation panel. A small **Checked** UTC date sits below the count. Each card has a **Model** link and a **Verify (API)** link to its public `downloadsAllTime` response. Visitors make no automatic API requests; missing data hides the count and date while keeping the headline and links. A returned zero is a valid count. These headlines are editorial text and are not rewritten by the scheduled updater.

`scripts/update_huggingface.py` reads the `huggingface_repo` fields in `_data/community_impact.yml`. Currently these are `westlake-repl/Evolla-10B-hf` and `westlake-repl/SaProt_650M_AF2`: the figures cover these exact repositories, not all models or variants in either project. Add another card with its explicit repo ID to track another model.

Each update makes one public GET per repository to `https://huggingface.co/api/models/{repo_id}?expand%5B%5D=downloadsAllTime`, with a 30-second timeout and no retries or redirects. No Hugging Face token, account secret, or SDK is required for these public repositories; standard HTTP proxy environment settings are supported. The updater reuses the existing PyYAML dependency. The API's `downloadsAllTime` field is cumulative, while `downloads` covers the last 30 days ([ModelInfo documentation](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api#huggingface_hub.ModelInfo)). These are [Hugging Face download counts](https://huggingface.co/docs/hub/models-download-stats), not unique users or guaranteed full-weight downloads.

Both repo IDs and nonnegative integer totals must validate before the snapshot is atomically replaced. HTTP errors, rate limits, timeouts, missing fields, monthly-only responses, wrong repos, and write failures preserve the previous counts **and** date. Zeroes and decreases are accepted if returned by the API. `updated_at` records our successful query date; the API does not provide a timestamp for the counter itself, so this does not claim real-time precision. The initial snapshot was queried on 2026-11-05.

```bash
python3 -m pip install -r scripts/requirements-scholar.txt
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/update_huggingface.py --output /tmp/huggingface-preview.json
```

Omit `--output` to update `_data/huggingface.json`. The Pages workflow checks this snapshot's age independently of Scholar and refreshes it after three UTC calendar days (normally two requests per refresh, about 20 requests per month). A failed refresh is eligible again the following day. The static downloadable CV PDFs remain manually maintained; this updater changes the website cards only.

### Homepage after-hours easter egg

The homepage's bilingual **Off the clock / 下班了** button opens a small lake with paper boats named after the featured publications. Move or tap on the water for ripples, click a boat to nudge it, and use **Back to shore / 回岸上** or **Esc** to return to the same scroll position. It runs entirely in the browser without services or extra dependencies, and never opens automatically. On entry, a note from the boss (老板 / PI) asks for one more experiment, then the rising water carries it away. Reduced-motion preferences skip this animation and show the still lake with its departure message; without JavaScript the button stays hidden.

In the lake, **Lake toys / 湖边玩具** opens three diversions:

- **Boss nearby / 老板来了** (or **B**) switches to a lab notebook and pauses the lake. Press **B** or **Esc**, or click **They’re gone / 走了走了**, to resume.
- **Lab vending / 实验室售货机** has 10 bilingual surprises, drawn without repeats each round. Five illustrated prizes can be unpacked at the lake: patrolling ducks, a paper-swallowing black hole, bottled sunsets, and more. A rowing voucher can still call the crew. [Prize checklist and effects](docs/lake-vending-prizes.md).
- **Call the rowing crew / 赛艇队来了** sends four rowers across the lake, sweeping away the paper boats. **Fish them back / 捞回论文** restores them. Reduced-motion visitors get the cleared lake immediately.

If a duck is already on the lake, the approaching crew makes it flash “!”, move aside, and rock twice in the wake before complaining, “Racing to a Nature deadline? / 赶着去投 Nature 啊？” It then eases back to its patrol. When there is room, a 15% chance adds a short chase and “带我一个，我负责通讯。” Reduced motion keeps a still duck with a bilingual quip.

Interactive prizes are available only through **Lab vending**. The temporary prize trial and lake reset shortcuts are hidden, leaving just the three menu items above.

**Esc** closes the current panel or menu first, then exits the lake. Leaving the lake resets these interactions; publication content is unchanged.

Markup lives in `_includes/after-hours.html` and its `after-hours-toys.html` / `after-hours-rowing-crew.html` includes. Styling is in `_sass/_after-hours*.scss`. `assets/js/after-hours.js` manages the lake; `assets/js/lake-prizes.js` holds the new prize catalog and SVG artwork, and `assets/js/lake-prize-effects.js` manages temporary effects and their reset/pause behavior; `assets/js/rowing-crew.js` draws the articulated athletes and alternating sweep oars on the same animation clock. The crew uses a longer racing shell, fixed foot stretchers, sliding seats, and connected hand/oar geometry, with a quick drive and slower feathered recovery. Technique references: [British Rowing](https://www.britishrowing.org/knowledge/rower-development/british-rowing-technique/water-rowing-technique/) and [Concept2 sweep rigging](https://www.concept2.com/oars/sweeps/length-and-rigging). Boat names come from the publication slugs already used on the homepage. The scene, controls, boss dialogue, and boat-click messages show English with Chinese alongside; rotating messages are paired in the script.

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

- A push to `master` builds the existing snapshots without calling SearchApi or Hugging Face. It also publishes the initial verified metrics.
- A lightweight scheduled check runs daily at **02:17 UTC** (10:17 Beijing time). `scripts/check_metric_schedule.py` checks `_data/scholar.json` and `_data/huggingface.json` independently and refreshes each source only after **three UTC calendar days**. If neither is due, build and deployment are skipped. Missing, invalid, or future dates trigger a refresh for that source. Using date differences preserves the interval across month and year boundaries. A failed fetch leaves its previous date intact and is tried again the next day. GitHub schedules can be delayed or dropped, so the exact execution time is not guaranteed.
- A manual run from the Actions tab always requests both sources immediately, regardless of their age. It can also retry a deployment that failed after new snapshots had already been committed.
- After tests and a successful build, an update run commits only the successfully refreshed metric files (`_data/scholar.json` and/or `_data/huggingface.json`) if they changed, then deploys the built artifact in the same run. Unchanged counts can still receive a newer successful check date; Scholar continues using the provider response date. A `GITHUB_TOKEN` commit does not trigger another Pages build, so the explicit deployment is required.
- Refresh failures are isolated: one source can publish new data while the other retains its previous snapshot. The Actions summary lists each result, and a separate job reports refresh failures after the deployment attempt, so a failed source remains visible without blocking the other source.
- Publishing runs share one concurrency group. If `master` moves during the build, the workflow stops instead of force-pushing or knowingly publishing an obsolete checkout.

After enabling Actions publishing, first verify a normal push deployment, then manually run `Pages` to verify both fetch-to-live-page paths. Check the Actions logs after failures; a 401 usually indicates a key problem, while a 429 indicates a quota or rate limit; neither means citations became zero. To return to manual data maintenance, remove the workflow's `schedule` trigger and keep push deployment enabled. Public-repository schedules can be disabled after 60 days without repository activity; re-enable them in Actions when needed.

## Acknowledgement

Built with [Academic Pages](https://github.com/academicpages/academicpages.github.io) (Jekyll).

## English and Simplified Chinese

The existing URLs remain the original mixed English/Chinese interface: Chinese hero text, bilingual blog subtitles, and paired lake dialogue remain visible alongside English. Chinese pages use the same URLs prefixed with `/zh`, for example `https://zhoubay.github.io/zh/research/`. The **English | 中文** links remain visible in the header on desktop and mobile and open the corresponding page. URLs determine the language; there is no browser-language detection or stored preference. JavaScript preserves the query string and section fragment when switching; the ordinary links also work without JavaScript.

Both languages are generated in one normal Jekyll build by the local localization plugin. Keep the existing GitHub Actions build: the GitHub Pages built-in safe build does not load this local plugin. Authors, dates, DOI identifiers, citations, BibTeX, asset paths, metrics, and resource URLs stay on the original source record. Translated detail pages are ordinary generated pages, so publication and talk collections never contain duplicate records.

Content translations use per-record `i18n.zh` overlays. Page metadata and translated Markdown are keyed by the source document's unique `translation_key` (`page.*`, `publication.*`, `talk.*`, or `post.*`). Shared templates read `content_data`; `t`, `localize_doc`, `locale_url`, and `localized_date` provide UI labels, translated record views, internal links, and displayed dates. For a new page, add its translation and explicit permalink together. Translations must not copy shared factual fields. Do not add generated Chinese pages to the source tree.

The three existing Chinese blog posts keep one source body. Their English interface explicitly identifies the Chinese-only article, and both interface URLs canonicalize to the Chinese version. The sitemap includes the Chinese article once; the Atom feed keeps its existing entries and URLs with the actual body language. A future English article translation will need a separate translated body and a corresponding update to this explicit exception.

Original images, certificates, posters, and PDFs are retained. Chinese image captions explain embedded English text; the existing English and Chinese CV downloads remain available.

Primary implementation and content locations:

```text
/zhouxibin/workspaces/zhoubay.github.io/_plugins/localization.rb
/zhouxibin/workspaces/zhoubay.github.io/_data/page_translations.yml
/zhouxibin/workspaces/zhoubay.github.io/_data/translations.yml
/zhouxibin/workspaces/zhoubay.github.io/_data/page_ui.yml
/zhouxibin/workspaces/zhoubay.github.io/_data
/zhouxibin/workspaces/zhoubay.github.io/assets/js/i18n.js
/zhouxibin/workspaces/zhoubay.github.io/scripts/check_localization.py
```

Validate before publishing (run the build from the repository root):

```bash
cd /zhouxibin/workspaces/zhoubay.github.io
python3 /zhouxibin/workspaces/zhoubay.github.io/scripts/check_localization.py
python3 -m unittest discover -s /zhouxibin/workspaces/zhoubay.github.io/tests -p 'test_*.py'
bundle exec jekyll build --destination /tmp/zhoubay-bilingual-preview
python3 /zhouxibin/workspaces/zhoubay.github.io/scripts/check_localization.py --site /tmp/zhoubay-bilingual-preview
```

The Pages workflow runs these translation checks before publishing, including missing translations, page pairing, same-language internal links, canonical/hreflang metadata, unchanged citations, and duplicate lists. When changing interactive scripts, also rebuild the existing JavaScript bundle and test keyboard navigation, reduced motion, and both language choices.
