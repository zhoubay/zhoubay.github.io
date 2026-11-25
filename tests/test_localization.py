"""Offline regressions for missing translations and broken bilingual navigation."""

from pathlib import Path
import tempfile
import unittest

import yaml

from scripts import check_localization as localization


class LocalizationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.site = self.root / "build"
        self.site.mkdir()

    def write(self, path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def source(self, key="page.home", url="/", folder="_pages", **extra):
        metadata = {"translation_key": key, "permalink": url, "title": "Example", **extra}
        path = self.root / folder / (key + ".md")
        self.write(path, "---\n" + yaml.safe_dump(metadata) + "---\nExample body.\n")
        return localization.Source(path, metadata, "Example body.")

    def translations(self, value):
        self.write(self.root / "_data" / "page_translations.yml", yaml.safe_dump(value, allow_unicode=True))

    def output_path(self, url):
        return self.site / (url.lstrip("/") + "index.html" if url.endswith("/") else url.lstrip("/") + ("" if Path(url).suffix else ".html"))

    def pair(self, source, en_body="", zh_body=""):
        for lang, url, body in (("en", source.url, en_body), ("zh-CN", source.zh_url, zh_body)):
            canonical = source.zh_url if source.chinese_body else url
            alternates = "" if source.chinese_body else (
                f'<link rel="alternate" hreflang="en" href="https://example.test{source.url}">'
                f'<link rel="alternate" hreflang="zh-CN" href="https://example.test{source.zh_url}">'
            )
            self.write(self.output_path(url), (
                f'<html lang="{lang}"><head><link rel="canonical" href="https://example.test{canonical}">{alternates}</head><body>'
                '<nav class="language-switcher">'
                f'<a data-lang="en" href="{source.url}">English</a>'
                f'<a data-lang="zh-CN" href="{source.zh_url}">中文</a></nav>{body}</body></html>'
            ))

    def listing(self, source, list_url, card):
        for prefix in ("", "/zh"):
            self.write(self.output_path(prefix + list_url), (
                f'<article class="{card}"><h3 class="{card}__title">'
                f'<a href="{prefix}{source.url}">Example</a></h3></article>'
            ))

    def test_source_translation_is_required_and_unknown_keys_are_rejected(self):
        self.source()
        self.translations({"page.typo": {"title": "中文"}})
        _, errors = localization.check_sources(self.root)
        self.assertIn("page.home: missing page translation", errors)
        self.assertIn("unknown page translation: page.typo", errors)
        self.translations({"page.home": {"title": "中文"}})
        self.assertEqual(localization.check_sources(self.root)[1], [])

    def test_duplicate_and_absent_source_keys_fail(self):
        self.source()
        self.source(folder="_talks", url="/talk/")
        self.write(self.root / "_pages" / "missing.md", "---\ntitle: Missing\npermalink: /missing/\n---\n")
        self.translations({"page.home": {"title": "中文", "content": "正文"}})
        errors = localization.check_sources(self.root)[1]
        self.assertIn("duplicate translation_key: page.home", errors)
        self.assertTrue(any("missing translation_key" in error for error in errors))

    def test_factual_metadata_and_unknown_fields_cannot_be_copied_into_translations(self):
        self.source()
        self.translations({"page.home": {"title": "中文", "doi": "10.1/example", "authors": "A", "date": "2026-11-24", "titel": "typo"}})
        errors = localization.check_sources(self.root)[1]
        for field in ("doi", "authors", "date"):
            self.assertIn(f"page.home: translated fact is not allowed: {field}", errors)
        self.assertIn("page.home: unknown translation field: titel", errors)

    def test_duplicate_yaml_translation_keys_do_not_silently_override(self):
        self.source()
        self.write(self.root / "_data" / "page_translations.yml", "page.home:\n  title: First\npage.home:\n  title: Second\n")
        self.assertTrue(any("duplicate YAML key: page.home" in error for error in localization.check_sources(self.root)[1]))

    def test_nested_visible_text_requires_translation_but_identifiers_do_not(self):
        data = [{"name": "SaProt", "date": "2026-11-14", "url": "/publication/SaProt", "photos": [{"alt": "Rowers", "i18n": {"zh": {"caption": "赛艇"}}}]}]
        errors = []
        localization.check_data_coverage(data, "sports", errors)
        self.assertEqual(errors, ["sports[0].photos[0].alt: missing i18n.zh translation"])
        data[0]["photos"][0]["i18n"]["zh"]["alt"] = "赛艇队员"
        errors = []
        localization.check_data_coverage(data, "sports", errors)
        self.assertEqual(errors, [])

    def test_complete_language_pairs_accept_queries_fragments_and_external_links(self):
        home = self.source()
        research = self.source("page.research", "/research/")
        self.pair(home, zh_body='<a href="https://example.test/zh/research/?topic=plm#models">Research</a><a href="https://external.test/research/">External</a>')
        self.pair(research, zh_body='<h2 id="models">Models</h2><a href="#models">Section</a>')
        self.assertEqual(localization.check_build(self.root, self.site, [home, research]), [])

    def test_language_mismatch_bad_switch_and_missing_fragment_are_detected(self):
        source = self.source()
        self.pair(source, zh_body='<a href="#missing">Missing</a>')
        path = self.output_path(source.zh_url)
        self.write(path, path.read_text().replace('lang="zh-CN"', 'lang="en"').replace('data-lang="en"', 'data-lang="wrong"'))
        errors = localization.check_build(self.root, self.site, [source])
        self.assertTrue(any("html lang must be zh-CN" in error for error in errors))
        self.assertTrue(any("incorrect en language switch" in error for error in errors))
        self.assertTrue(any("missing link fragment" in error for error in errors))

    def test_chinese_links_cannot_leak_to_english_and_broken_paths_fail(self):
        home = self.source()
        research = self.source("page.research", "/research/")
        self.pair(home, zh_body='<a href="https://example.test/research/">English leak</a><a href="/zh/deleted/">Broken</a>')
        self.pair(research)
        errors = localization.check_build(self.root, self.site, [home, research])
        self.assertEqual(sum("Chinese link points to English page" in error for error in errors), 1)
        self.assertTrue(any("broken internal link: /zh/deleted/" in error for error in errors))

    def test_html_extensionless_paths_and_original_aliases_are_checked(self):
        source = self.source("page.error", "/404.html", redirect_from=["/old-error"])
        self.pair(source)
        self.write(self.site / "old-error", "Redirect")
        self.assertEqual(localization.resolve_output(self.site, "/old-error"), self.site / "old-error")
        self.assertEqual(localization.check_build(self.root, self.site, [source]), [])
        (self.site / "old-error").unlink()
        self.assertIn("/old-error: original redirect alias is missing", localization.check_build(self.root, self.site, [source]))

    def test_citations_are_preserved_and_collection_cards_are_not_duplicated(self):
        source = self.source("publication.example", "/publication/Example", "_publications", citation="A & B", bibtex="@article{example}")
        citation = '<textarea id="citation-copy-source">A &amp; B</textarea><textarea id="bibtex-copy-source">@article{example}</textarea>'
        self.pair(source, citation, citation)
        self.listing(source, "/publications/", "pub-card")
        self.assertEqual(localization.check_build(self.root, self.site, [source]), [])
        detail = self.output_path(source.zh_url)
        self.write(detail, detail.read_text().replace("@article{example}", "@article{changed}"))
        listing = self.output_path("/zh/publications/")
        self.write(listing, listing.read_text() * 2)
        errors = localization.check_build(self.root, self.site, [source])
        self.assertTrue(any("bibtex differs" in error for error in errors))
        self.assertTrue(any("expected 1 distinct pub-card entries" in error for error in errors))

    def test_chinese_only_blog_alias_has_one_canonical_without_false_english_hreflang(self):
        source = self.source("post.example", "/blog/example/", "_posts", content_lang="zh-CN")
        self.pair(source)
        self.listing(source, "/blog/", "blog-card")
        self.write(self.site / "sitemap.xml", '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.test/zh/blog/example/</loc></url></urlset>')
        self.write(self.site / "feed.xml", '<feed xmlns="http://www.w3.org/2005/Atom"><entry><link rel="alternate" href="https://example.test/blog/example/" /></entry></feed>')
        self.assertEqual(localization.check_build(self.root, self.site, [source]), [])
        original = self.output_path(source.url)
        self.write(original, original.read_text().replace('</head>', '<link rel="alternate" hreflang="en" href="/blog/example/"></head>'))
        self.write(self.site / "sitemap.xml", '<urlset><url><loc>https://example.test/blog/example/</loc></url></urlset>')
        errors = localization.check_build(self.root, self.site, [source])
        self.assertTrue(any("incorrectly advertises an English translation" in error for error in errors))
        self.assertTrue(any("duplicate English-interface Chinese blog URL" in error for error in errors))
        self.assertTrue(any("Chinese blog canonical URL is missing" in error for error in errors))


    def test_editorial_figure_explanations_and_badges_are_allowed(self):
        self.source()
        self.translations({"page.home": {"title": "中文", "cartoon_caption": "中文图注", "illustration_notes": "图中术语对照", "badge": "审稿中"}})
        self.assertEqual(localization.check_sources(self.root)[1], [])

    def test_raw_translated_section_headers_fail_but_literal_code_is_allowed(self):
        source = self.source()
        literal_code = '<pre>{{ code_example }}</pre><code>{% literal %}</code><script>var template = "{{ variable }}";</script>'
        self.pair(source, literal_code, literal_code)
        self.assertEqual(localization.check_build(self.root, self.site, [source]), [])
        for broken_header in ("<h2>{{ 'Research' | t: page.lang }}</h2>", '<h2>{% include section-header.html %}</h2>'):
            with self.subTest(header=broken_header):
                self.pair(source, literal_code, literal_code + broken_header)
                errors = localization.check_build(self.root, self.site, [source])
                self.assertEqual(sum("unrendered Liquid" in error for error in errors), 1)

    def test_archive_card_english_title_is_caught_even_when_its_link_is_chinese(self):
        home = self.source()
        archive = self.source("page.archive", "/page-archive/", layout="archive")
        self.translations({home.key: {"title": "首页"}, archive.key: {"title": "页面归档"}})
        self.pair(home)
        archive_body = '<h1 class="page__title">页面归档</h1><article class="directory-card"><h3 class="directory-card__title"><a href="/zh/">Example</a></h3></article>'
        self.pair(archive, zh_body=archive_body)
        errors = localization.check_build(self.root, self.site, [home, archive])
        self.assertEqual(errors, ["/zh/page-archive/: Chinese card title is untranslated or incorrect: /zh/"])
        self.pair(archive, zh_body=archive_body.replace("Example", "首页"))
        self.assertEqual(localization.check_build(self.root, self.site, [home, archive]), [])
        self.pair(archive, zh_body=archive_body.replace("页面归档", "Page Archive").replace("Example", "首页"))
        self.assertTrue(any("Chinese page heading" in error for error in localization.check_build(self.root, self.site, [home, archive])))

    def test_publication_titles_and_summaries_must_be_translated_in_details_and_lists(self):
        source = self.source("publication.example", "/publication/Example", "_publications", summary="English summary")
        listing = self.source("page.publications", "/publications/")
        self.translations({source.key: {"title": "论文中文译题", "summary": "论文中文摘要"}, listing.key: {"title": "论文"}})
        detail = '<h1 class="publication-hero__title">论文中文译题</h1><p class="publication-lead">论文中文摘要</p>'
        card = '<article class="pub-card"><h3 class="pub-card__title"><a href="{prefix}/publication/Example">{title}</a></h3><p class="pub-card__summary">{summary}</p></article>'
        en_list = card.format(prefix="", title="Example", summary="English summary")
        zh_list = '<h1 class="page__title">论文</h1>' + card.format(prefix="/zh", title="论文中文译题", summary="论文中文摘要")
        self.pair(source, zh_body=detail)
        self.pair(listing, en_body=en_list, zh_body=zh_list)
        self.assertEqual(localization.check_build(self.root, self.site, [source, listing]), [])
        self.pair(source, zh_body=detail.replace("论文中文摘要", "English summary"))
        self.pair(listing, en_body=en_list, zh_body=zh_list.replace("论文中文译题", "Example").replace("论文中文摘要", "English summary"))
        errors = localization.check_build(self.root, self.site, [source, listing])
        self.assertTrue(any("Chinese publication summary is missing" in error for error in errors))
        self.assertTrue(any("Chinese card title is untranslated" in error for error in errors))
        self.assertTrue(any("missing translated publication summary" in error for error in errors))

    def test_feed_cannot_duplicate_a_blog_for_its_translated_url(self):
        source = self.source("post.example", "/blog/example/", "_posts")
        self.pair(source)
        self.listing(source, "/blog/", "blog-card")
        self.write(self.site / "feed.xml", '<feed xmlns="http://www.w3.org/2005/Atom"><entry><link rel="alternate" href="https://example.test/blog/example/" /></entry><entry><link rel="alternate" href="https://example.test/zh/blog/example/" /></entry></feed>')
        errors = localization.check_build(self.root, self.site, [source])
        self.assertEqual(len(errors), 1)
        self.assertIn("expected 1 distinct blog entries without translated duplicates", errors[0])


if __name__ == "__main__":
    unittest.main()
