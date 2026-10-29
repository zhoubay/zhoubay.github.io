#!/usr/bin/env python3
"""Refresh the site's Google Scholar snapshot with one direct profile request."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

from bs4 import BeautifulSoup
import yaml


class ScholarUpdateError(Exception):
    """A fetch, validation, or persistence failure that leaves the snapshot intact."""


class NoRedirect(HTTPRedirectHandler):
    """Do not turn one profile GET into additional requests or a challenge visit."""

    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def read_profile_url(config_path: Path) -> str:
    """Use the configured author ID and request English profile labels."""
    try:
        config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
        url = config["author"]["googlescholar"]
        if not isinstance(url, str):
            raise ValueError("the profile URL must be a string")
        parts = urlsplit(url)
        ids = parse_qs(parts.query).get("user", [])
        if (
            parts.scheme != "https"
            or parts.netloc != "scholar.google.com"
            or parts.path != "/citations"
            or len(ids) != 1
            or not re.fullmatch(r"[A-Za-z0-9_-]+", ids[0])
        ):
            raise ValueError("expected an HTTPS Google Scholar citations URL with one user ID")
    except (OSError, UnicodeError, yaml.YAMLError, KeyError, TypeError, ValueError) as exc:
        raise ScholarUpdateError(f"Cannot read author.googlescholar from {config_path}: {exc}") from exc
    return "https://scholar.google.com/citations?" + urlencode({"user": ids[0], "hl": "en"})


def fetch_profile(url: str) -> str:
    """Perform exactly one GET, with no proxy, redirects, or retries."""
    opener = build_opener(ProxyHandler({}), NoRedirect())
    request = Request(url, headers={"Accept": "text/html", "Accept-Language": "en"}, method="GET")
    try:
        with opener.open(request, timeout=20) as response:
            if response.status != 200:
                raise ScholarUpdateError(f"Google Scholar returned HTTP {response.status}")
            encoding = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(encoding)
    except HTTPError as exc:
        raise ScholarUpdateError(f"Google Scholar returned HTTP {exc.code}; no update saved") from exc
    except (URLError, OSError, UnicodeError, LookupError) as exc:
        raise ScholarUpdateError(f"Cannot fetch Google Scholar profile: {exc}") from exc


def normalized_text(node) -> str:
    return " ".join(node.get_text(" ", strip=True).split()).casefold()


def parse_metrics(html: str) -> dict[str, int]:
    """Read named rows from the explicit All column, never the recent column."""
    soup = BeautifulSoup(html, "html.parser")
    page_text = normalized_text(soup)
    challenge_phrases = (
        "unusual traffic",
        "verify you are human",
        "verify that you are human",
        "not a robot",
        "complete the captcha",
        "access denied",
        "enable javascript and cookies to continue",
    )
    if any(phrase in page_text for phrase in challenge_phrases) or soup.select_one(
        "[id*='captcha'], [class*='captcha'], input[name='captcha'], "
        "iframe[src*='/recaptcha/'], form[action*='/sorry/']"
    ):
        raise ScholarUpdateError("Google Scholar returned a CAPTCHA or access challenge")

    tables = soup.select("table#gsc_rsb_st")
    if len(tables) != 1:
        raise ScholarUpdateError("Expected one Google Scholar citation statistics table")
    table = tables[0]
    header_rows = [row for row in table.find_all("tr") if row.find("th", recursive=False)]
    if len(header_rows) != 1:
        raise ScholarUpdateError("Expected one citation statistics header row")
    headers = header_rows[0].find_all(["th", "td"], recursive=False)
    all_columns = [index for index, cell in enumerate(headers) if normalized_text(cell) == "all"]
    if len(all_columns) != 1 or all_columns[0] == 0:
        raise ScholarUpdateError("Citation statistics must have one explicit All column")
    all_column = all_columns[0]

    row_names = {"citations": "citations", "h-index": "h_index"}
    metrics = {}
    for row in table.find_all("tr"):
        cells = row.find_all("td", recursive=False)
        if not cells:
            continue
        key = row_names.get(normalized_text(cells[0]))
        if key is None:
            continue
        if key in metrics or len(cells) != len(headers):
            raise ScholarUpdateError(f"Missing or ambiguous statistics cells for {key}")
        raw_value = " ".join(cells[all_column].get_text(" ", strip=True).split())
        if not re.fullmatch(r"(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)", raw_value):
            raise ScholarUpdateError(f"Invalid nonnegative integer for {key}: {raw_value!r}")
        metrics[key] = int(raw_value.replace(",", ""))

    if metrics.keys() != {"citations", "h_index"}:
        raise ScholarUpdateError("Google Scholar statistics are missing Citations or h-index")
    return metrics


def write_snapshot(output_path: Path, snapshot: dict) -> None:
    """Replace the file only after a complete temporary snapshot reaches disk."""
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", newline="\n", dir=output_path.parent,
            prefix=f".{output_path.name}.", suffix=".tmp", delete=False,
        ) as handle:
            temporary_path = Path(handle.name)
            json.dump(snapshot, handle, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary_path, 0o644)
        os.replace(temporary_path, output_path)
        temporary_path = None
    except OSError as exc:
        raise ScholarUpdateError(f"Cannot save Scholar snapshot: {exc}") from exc
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def update_scholar(config_path: Path, output_path: Path) -> dict:
    profile_url = read_profile_url(config_path)
    metrics = parse_metrics(fetch_profile(profile_url))
    snapshot = {
        "citations": metrics["citations"],
        "h_index": metrics["h_index"],
        "updated_at": datetime.now(timezone.utc).date().isoformat(),
    }
    write_snapshot(output_path, snapshot)
    return snapshot


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=Path("_config.yml"))
    parser.add_argument("--output", type=Path, default=Path("_data/scholar.json"))
    args = parser.parse_args(argv)
    try:
        snapshot = update_scholar(args.config, args.output)
    except (ScholarUpdateError, OSError) as exc:
        print(f"Scholar update failed: {exc}", file=sys.stderr)
        return 1
    print(
        f"Saved Scholar snapshot: {snapshot['citations']} citations, "
        f"h-index {snapshot['h_index']} (checked {snapshot['updated_at']} UTC)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
