#!/usr/bin/env python3
"""Validate maintained translations and, optionally, the generated bilingual site offline."""

from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

import yaml


SOURCE_FOLDERS = ("_pages", "_publications", "_talks", "_posts")
CONTENT_DATA = (
    "about", "authors", "community_impact", "cv", "hero", "honors", "interests",
    "languages", "news", "research", "sports_awards", "water_sports", "navigation",
)
TEXT_FIELDS = {
    "title", "description", "text", "summary", "subtitle", "slogan", "lede",
    "bio", "location", "employer", "name", "detail", "period", "date_label",
    "date", "intro", "caption", "alt", "photo_alt", "label", "link_label",
    "sport", "award", "division", "event", "badge",
}
# These are model names, publication names, and identifiers rather than prose.
PROPER_NAMES = {
    "SaProt", "SaprotHub", "PLM-guided eTDG", "ESM-Ezy", "ProTrek", "Evolla",
    "Pinal", "Nature 2026", "GitHub", "Google Scholar", "ORCID", "DOI", "PDF", "BibTeX",
}
TRANSLATED_FIELDS = {
    "title", "description", "excerpt", "summary", "content", "type", "venue",
    "location", "subtitle_zh", "subtitle_en", "series", "cartoon_alt", "featured",
    "cartoon_caption", "illustration_notes", "badge",
}
FACT_FIELDS = {
    "date", "last_modified_at", "authors", "author", "citation", "bibtex", "doi",
    "paperurl", "slug", "links", "cartoon_webp", "cartoon_fallback", "redirect_from",
    "permalink", "translation_key", "year", "language", "series_part",
}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class UniqueKeyLoader(yaml.SafeLoader):
    """Do not silently discard duplicate translation keys in YAML."""


def _unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f"duplicate YAML key: {key}")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _unique_mapping)


def read_yaml(path: Path):
    return yaml.load(path.read_text(encoding="utf-8"), Loader=UniqueKeyLoader) or {}


@dataclass
class Source:
    path: Path
    metadata: dict
    body: str = ""

    @property
    def key(self):
        return self.metadata.get("translation_key")

    @property
    def url(self):
        return self.metadata.get("permalink", "")

    @property
    def zh_url(self):
        return "/zh" + self.url

    @property
    def chinese_body(self):
        return self.metadata.get("content_lang", "").startswith("zh")


def load_sources(root: Path, errors: list[str]) -> list[Source]:
    result = []
    for folder in SOURCE_FOLDERS:
        for path in sorted((root / folder).rglob("*")):
            if not path.is_file() or path.suffix not in {".md", ".markdown", ".html"}:
                continue
            text = path.read_text(encoding="utf-8")
            match = re.match(r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z", text, re.DOTALL)
            if not match:
                errors.append(f"{path}: missing front matter")
                continue
            try:
                metadata = yaml.load(match[1], Loader=UniqueKeyLoader)
                if not isinstance(metadata, dict):
                    raise ValueError("front matter must be a mapping")
                result.append(Source(path, metadata, match[2]))
            except (yaml.YAMLError, ValueError) as exc:
                errors.append(f"{path}: {exc}")
    return result


def check_data_coverage(value, location: str, errors: list[str]):
    """Require Chinese overlays for prose, including nested records and photo alt text."""
    if isinstance(value, list):
        for index, item in enumerate(value):
            check_data_coverage(item, f"{location}[{index}]", errors)
    elif isinstance(value, dict):
        overlay = value.get("i18n", {}).get("zh", {})
        for key, item in value.items():
            if key == "i18n":
                continue
            if key in TEXT_FIELDS and isinstance(item, str) and re.search(r"[A-Za-z]", item) and item not in PROPER_NAMES:
                if not isinstance(overlay.get(key), str) or not overlay[key].strip():
                    errors.append(f"{location}.{key}: missing i18n.zh translation")
            check_data_coverage(item, f"{location}.{key}", errors)


def check_sources(root: Path) -> tuple[list[Source], list[str]]:
    errors = []
    sources = load_sources(root, errors)
    try:
        translations = read_yaml(root / "_data" / "page_translations.yml")
        if not isinstance(translations, dict):
            raise ValueError("page translations must be a mapping")
    except (OSError, yaml.YAMLError, ValueError) as exc:
        return sources, errors + [f"{root / '_data' / 'page_translations.yml'}: {exc}"]
    keys = [source.key for source in sources if source.key]
    for key, count in Counter(keys).items():
        if count > 1:
            errors.append(f"duplicate translation_key: {key}")
    for key in sorted(set(translations) - set(keys)):
        errors.append(f"unknown page translation: {key}")
    for source in sources:
        if not source.key:
            errors.append(f"{source.path}: missing translation_key")
            continue
        if not source.url.startswith("/"):
            errors.append(f"{source.path}: explicit absolute permalink required")
        translated = translations.get(source.key)
        if not isinstance(translated, dict):
            errors.append(f"{source.key}: missing page translation")
            continue
        for field in sorted(set(translated) & FACT_FIELDS):
            errors.append(f"{source.key}: translated fact is not allowed: {field}")
        for field in sorted(set(translated) - TRANSLATED_FIELDS - FACT_FIELDS):
            errors.append(f"{source.key}: unknown translation field: {field}")
        if not isinstance(translated.get("title"), str) or not translated["title"].strip():
            errors.append(f"{source.key}: missing Chinese title")
        if source.path.parent.name in {"_publications", "_talks"}:
            for field in ("excerpt", "summary"):
                if source.metadata.get(field) and not translated.get(field):
                    errors.append(f"{source.key}: missing Chinese {field}")
            if source.body.strip() and not translated.get("content"):
                errors.append(f"{source.key}: missing Chinese body")
        if source.chinese_body and "content" in translated:
            errors.append(f"{source.key}: Chinese blog body must remain shared")
    for name in CONTENT_DATA:
        path = root / "_data" / f"{name}.yml"
        if not path.exists():
            continue
        try:
            check_data_coverage(read_yaml(path), str(path), errors)
        except (yaml.YAMLError, ValueError) as exc:
            errors.append(f"{path}: {exc}")
    path = root / "_data" / "talk_languages.yml"
    if path.exists():
        languages = read_yaml(path)
        for key in languages.keys() - {"i18n"}:
            if not languages.get("i18n", {}).get("zh", {}).get(key):
                errors.append(f"{path}.{key}: missing i18n.zh translation")
    return sources, errors


class PageHTML(HTMLParser):
    """Collect only semantic HTML needed for link, language, and citation checks."""

    def __init__(self, text: str):
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.stack = []
        self.ids = set()
        self.anchors = []
        self.canonicals = []
        self.alternates = {}
        self.regions = {}
        self.cards = Counter()
        self.class_text = {}
        self.anchor_text = {}
        self.raw_liquid = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set(attrs.get("class", "").split())
        if tag == "html":
            self.lang = attrs.get("lang")
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and "name" in attrs:
            self.ids.add(attrs["name"])
        ancestry = set().union(*(frame[1] for frame in self.stack), classes)
        chunks = []
        if tag == "a" and "href" in attrs:
            self.anchors.append((attrs, ancestry))
            self.anchor_text[id(attrs)] = chunks
        for name in classes:
            self.class_text.setdefault(name, []).append(chunks)
        if not any(frame[0] in {"pre", "code", "script", "style"} for frame in self.stack):
            for name, value in attrs.items():
                if value and ("{{" in value or "{%" in value):
                    self.raw_liquid.append(f"{name}={value[:120]}")
        if tag == "link":
            if "canonical" in attrs.get("rel", "").split():
                self.canonicals.append(attrs.get("href", ""))
            if "alternate" in attrs.get("rel", "").split() and attrs.get("hreflang"):
                self.alternates[attrs["hreflang"]] = attrs.get("href", "")
        for card in classes & {"pub-card", "talk-card", "blog-card"}:
            self.cards[card] += 1
        if tag not in VOID_TAGS:
            self.stack.append((tag, classes, attrs.get("id"), chunks))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        for _, _, identifier, chunks in self.stack:
            chunks.append(data)
            if identifier:
                self.regions.setdefault(identifier, []).append(data)
        if not any(frame[0] in {"pre", "code", "script", "style"} for frame in self.stack):
            if "{{" in data or "{%" in data:
                self.raw_liquid.append(data.strip()[:120])

    def region(self, identifier):
        return "".join(self.regions.get(identifier, [])).strip()

    def texts(self, class_name):
        return [normalize_text("".join(chunks)) for chunks in self.class_text.get(class_name, [])]

    def link_text(self, attrs):
        return normalize_text("".join(self.anchor_text.get(id(attrs), [])))


def normalize_text(value):
    return re.sub(r"\s+", " ", unescape(str(value))).strip()


def resolve_output(site: Path, url: str) -> Path | None:
    """Jekyll may write a URL as a directory, .html file, or extensionless file."""
    path = site / unquote(urlsplit(url).path).lstrip("/")
    candidates = [path] if path.suffix else [path, Path(str(path) + ".html")]
    candidates.append(path / "index.html")
    for candidate in candidates:
        if candidate.is_file() and candidate.resolve().is_relative_to(site.resolve()):
            return candidate
    return None


def normalized_path(url: str) -> str:
    path = unquote(urlsplit(url).path)
    return path.rstrip("/") or "/"


def local_target(href: str, current: str, origin: str, baseurl: str = "") -> tuple[str, str] | None:
    target = urlsplit(urljoin(origin + baseurl + current, href))
    if target.scheme not in {"http", "https"} or target.netloc != urlsplit(origin).netloc:
        return None
    path = unquote(target.path)
    if baseurl:
        if path != baseurl and not path.startswith(baseurl + "/"):
            return None
        path = path[len(baseurl):] or "/"
    return path, unquote(target.fragment)


def check_build(root: Path, site: Path, sources: list[Source]) -> list[str]:
    errors = []
    config = read_yaml(root / "_config.yml") if (root / "_config.yml").exists() else {}
    origin = config.get("url", "https://example.test").rstrip("/")
    baseurl = (config.get("baseurl") or "").rstrip("/")
    parsed = {}
    translation_path = root / "_data" / "page_translations.yml"
    translations = read_yaml(translation_path) if translation_path.exists() else {}
    translated_by_url = {normalized_path(source.zh_url): translations.get(source.key, {}) for source in sources}

    def page(url):
        path = resolve_output(site, url)
        if path is None:
            return None
        if path not in parsed:
            parsed[path] = PageHTML(path.read_text(encoding="utf-8"))
        return parsed[path]

    english_urls = set()
    for source in sources:
        english_urls.add(normalized_path(source.url))
        aliases = source.metadata.get("redirect_from", [])
        if isinstance(aliases, str):
            aliases = [aliases]
        for alias in aliases:
            english_urls.add(normalized_path(alias))
            if not resolve_output(site, alias):
                errors.append(f"{alias}: original redirect alias is missing")
        pair = {"en": source.url, "zh-CN": source.zh_url}
        for lang, url in pair.items():
            document = page(url)
            if document is None:
                errors.append(f"{url}: generated page is missing")
                continue
            if document.lang != lang:
                errors.append(f"{url}: html lang must be {lang}, got {document.lang!r}")
            for fragment in document.raw_liquid:
                errors.append(f"{url}: unrendered Liquid in HTML: {fragment}")
            translated = translations.get(source.key, {})
            if lang == "zh-CN" and translated and source.url != "/" and source.metadata.get("layout") != "home":
                headings = document.texts("page__title") + document.texts("publication-hero__title") + document.texts("error-card__title")
                if normalize_text(translated["title"]) not in headings:
                    errors.append(f"{url}: Chinese page heading does not match its translated title")
                if source.path.parent.name == "_publications":
                    summary = translated.get("summary") or translated.get("excerpt")
                    if summary and normalize_text(summary) not in document.texts("publication-lead"):
                        errors.append(f"{url}: Chinese publication summary is missing or untranslated")
            switches = {attrs.get("data-lang"): attrs["href"] for attrs, ancestors in document.anchors if "language-switcher" in ancestors}
            for switch_lang, target in pair.items():
                actual = local_target(switches.get(switch_lang, ""), url, origin, baseurl)
                if switch_lang not in switches or actual is None or normalized_path(actual[0]) != normalized_path(target):
                    errors.append(f"{url}: missing or incorrect {switch_lang} language switch")
            canonical = source.zh_url if source.chinese_body else url
            targets = [local_target(value, url, origin, baseurl) for value in document.canonicals]
            if len(targets) != 1 or targets[0] is None or normalized_path(targets[0][0]) != normalized_path(canonical):
                errors.append(f"{url}: canonical must point to {canonical}")
            if source.chinese_body:
                if any(language.startswith("en") for language in document.alternates):
                    errors.append(f"{url}: Chinese-only blog incorrectly advertises an English translation")
            else:
                for alternate_lang, target in pair.items():
                    actual = local_target(document.alternates.get(alternate_lang, ""), url, origin, baseurl)
                    if alternate_lang not in document.alternates or actual is None or normalized_path(actual[0]) != normalized_path(target):
                        errors.append(f"{url}: missing or incorrect {alternate_lang} hreflang")
        if source.path.parent.name == "_publications":
            en, zh = page(source.url), page(source.zh_url)
            if en and zh:
                for field, identifier in (("citation", "citation-copy-source"), ("bibtex", "bibtex-copy-source")):
                    if source.metadata.get(field) and (not en.region(identifier) or en.region(identifier) != zh.region(identifier)):
                        errors.append(f"{source.zh_url}: {field} differs from the original or is missing")

    # Verify all Chinese page links, including fragments; same-origin absolute URLs count.
    for source in sources:
        url = source.zh_url
        document = page(url)
        if document is None:
            continue
        for attrs, ancestors in document.anchors:
            target = local_target(attrs["href"], url, origin, baseurl)
            if target is None:
                continue
            path, fragment = target
            title_classes = {"pub-card__title", "talk-card__title", "blog-card__title", "directory-card__title", "archive__item-title"}
            translated = translated_by_url.get(normalized_path(path), {})
            # Research project cards intentionally use short model names as their titles.
            short_project_name = source.url == "/research/" and "pub-card__title" in ancestors
            if translated.get("title") and ancestors & title_classes and not short_project_name:
                if document.link_text(attrs) != normalize_text(translated["title"]):
                    errors.append(f"{url}: Chinese card title is untranslated or incorrect: {attrs['href']}")
            if "language-switcher" not in ancestors and normalized_path(path) in english_urls:
                errors.append(f"{url}: Chinese link points to English page: {attrs['href']}")
            destination = resolve_output(site, path)
            if destination is None:
                errors.append(f"{url}: broken internal link: {attrs['href']}")
            elif fragment and (destination.suffix in {".html", ""}):
                target_page = page(path)
                if target_page and fragment not in target_page.ids:
                    errors.append(f"{url}: missing link fragment: {attrs['href']}")

    for folder, list_url, card in (("_publications", "/publications/", "pub-card"), ("_talks", "/talks/", "talk-card"), ("_posts", "/blog/", "blog-card")):
        members = [source for source in sources if source.path.parent.name == folder]
        if not members:
            continue
        for prefix in ("", "/zh"):
            url = prefix + list_url
            listing = page(url)
            if listing is None:
                errors.append(f"{url}: collection listing is missing")
                continue
            expected = Counter(normalized_path(prefix + member.url) for member in members)
            actual = Counter()
            for attrs, ancestors in listing.anchors:
                if card + "__title" in ancestors:
                    target = local_target(attrs["href"], url, origin, baseurl)
                    if target:
                        actual[normalized_path(target[0])] += 1
            if actual != expected or listing.cards[card] != len(members):
                errors.append(f"{url}: expected {len(members)} distinct {card} entries, found {listing.cards[card]} cards and {sum(actual.values())} title links")
            if prefix == "/zh" and folder == "_publications":
                for member in members:
                    translated = translations.get(member.key, {})
                    summary = translated.get("summary") or translated.get("excerpt")
                    if summary and normalize_text(summary) not in listing.texts("pub-card__summary"):
                        errors.append(f"{url}: missing translated publication summary: {member.key}")

    blogs = [source for source in sources if source.chinese_body]
    if blogs:
        sitemap = site / "sitemap.xml"
        try:
            xml = ET.parse(sitemap)
            urls = [normalized_path(node.text or "") for node in xml.iter() if node.tag.rsplit("}", 1)[-1] == "loc"]
            if len(urls) != len(set(urls)):
                errors.append(f"{sitemap}: duplicate sitemap URLs")
            for source in blogs:
                if normalized_path(baseurl + source.url) in urls:
                    errors.append(f"{sitemap}: duplicate English-interface Chinese blog URL: {source.url}")
                if normalized_path(baseurl + source.zh_url) not in urls:
                    errors.append(f"{sitemap}: Chinese blog canonical URL is missing: {source.zh_url}")
        except (OSError, ET.ParseError) as exc:
            errors.append(f"{sitemap}: {exc}")
    posts = [source for source in sources if source.path.parent.name == "_posts"]
    if posts:
        feed_path = site / "feed.xml"
        try:
            feed = ET.parse(feed_path)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            entries = feed.findall("atom:entry", ns)
            known_posts = {normalized_path(baseurl + url): source.key for source in posts for url in (source.url, source.zh_url)}
            entry_keys = []
            for entry in entries:
                alternate = next((link.get("href", "") for link in entry.findall("atom:link", ns) if link.get("rel") == "alternate"), "")
                entry_keys.append(known_posts.get(normalized_path(alternate)))
            expected_count = min(len(posts), config.get("feed", {}).get("posts_limit", 10))
            if len(entries) != expected_count or None in entry_keys or len(set(entry_keys)) != len(entry_keys):
                errors.append(f"{feed_path}: expected {expected_count} distinct blog entries without translated duplicates")
        except (OSError, ET.ParseError) as exc:
            errors.append(f"{feed_path}: {exc}")
    return list(dict.fromkeys(errors))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--site", type=Path, help="Also check a Jekyll output directory")
    args = parser.parse_args(argv)
    root = args.root.resolve()
    try:
        sources, errors = check_sources(root)
        if args.site:
            errors.extend(check_build(root, args.site.resolve(), sources))
    except (OSError, yaml.YAMLError, ValueError) as exc:
        errors = [str(exc)]
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    if errors:
        print(f"Localization validation failed ({len(errors)} errors).", file=sys.stderr)
        return 1
    print(f"Localization validation passed: {len(sources)} source pages and Chinese translations" + (", generated pages and internal links." if args.site else "."))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
