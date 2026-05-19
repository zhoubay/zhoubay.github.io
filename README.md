# Xibin Zhou — Academic Homepage

Personal website: **[zhoubay.github.io](https://zhoubay.github.io)**

Ph.D. candidate in Computer Science at [Westlake University](https://www.westlake.edu.cn/) (joint with Zhejiang University). Research on **protein language models**, multimodal protein AI, and **AI for Science**.

## Site structure

| Path | Content |
|------|---------|
| `_pages/main.md` | Homepage (layout: `home`) |
| `_layouts/home.html` | Full-width hero + section includes |
| `_data/hero.yml`, `about.yml`, `interests.yml`, `news.yml`, `honors.yml` | Homepage content |
| `_data/selected_publications.yml` | Homepage featured paper slugs (references `_publications/`) |
| `_pages/research.md` | Research themes |
| `_data/research.yml` | Research sections and project slug references |
| `_pages/publications.html` | Full publication list |
| `_publications/` | Paper collection (front matter) |
| `_pages/cv.md` | CV |
| `_data/cv.yml` | Education, experience, skills |
| `_pages/talks.html` | Talks |
| `_includes/pub-card.html` | Shared publication card component |
| `assets/js/site-reveal.js` | Scroll reveal animations |
| `_config.yml` | Site-wide settings |

## Editing content

- **News**: add entries to `_data/news.yml` (`date`, `text` in Markdown).
- **Honors**: `_data/honors.yml`.
- **New paper**: add `_publications/YYYY-MM-DD-slug.md` with `slug`, `venue`, `badge`, `journal_tag`, `summary`, `authors`, `links`, `paperurl`, `citation`, etc.
- **Homepage featured papers**: add the `slug` to `_data/selected_publications.yml` (`slugs` list; order = display order).
- **Research page projects**: add `slug` under the right section in `_data/research.yml` (`name` / `summary` / `badge` optional overrides).

## Local preview

```bash
bundle install
bundle exec jekyll serve -l -H localhost
```

Open [http://localhost:4000](http://localhost:4000). Restart after editing `_config.yml`.

## Deploy

Push to `master` on GitHub; [GitHub Pages](https://pages.github.com/) builds the site.

## Acknowledgement

Built with [Academic Pages](https://github.com/academicpages/academicpages.github.io) (Jekyll).
