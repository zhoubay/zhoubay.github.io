#!/usr/bin/env python3
"""Refresh the site's Google Scholar snapshot with one SearchApi author request."""

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

import yaml


class ScholarUpdateError(Exception):
    """A fetch, validation, or persistence failure that leaves the snapshot intact."""


class NoRedirect(HTTPRedirectHandler):
    """Keep the API key on the intended host and perform only one request."""

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


def fetch_profile(url: str) -> dict:
    """Fetch the configured author through SearchApi, without retries or redirects."""
    api_key = os.environ.get("SEARCHAPI_API_KEY", "").strip()
    if not api_key:
        raise ScholarUpdateError("SEARCHAPI_API_KEY is missing; configure the GitHub Actions repository secret")
    if not re.fullmatch(r"[!-~]+", api_key):
        raise ScholarUpdateError("SEARCHAPI_API_KEY has an invalid format")
    author_id = parse_qs(urlsplit(url).query)["user"][0]
    api_url = "https://www.searchapi.io/api/v1/search?" + urlencode({
        "engine": "google_scholar_author", "author_id": author_id, "hl": "en",
    })
    request = Request(api_url, headers={
        "Accept": "application/json", "Authorization": f"Bearer {api_key}",
    }, method="GET")
    opener = build_opener(ProxyHandler({}), NoRedirect())
    try:
        with opener.open(request, timeout=110) as response:
            if response.status != 200:
                raise ScholarUpdateError(f"SearchApi returned HTTP {response.status}; no update saved")
            return json.loads(response.read())
    except HTTPError as exc:
        hints = {
            401: "check SEARCHAPI_API_KEY", 403: "check account access",
            429: "check the request quota or rate limit",
            500: "provider error", 503: "provider timeout",
        }
        hint = hints.get(exc.code, "request rejected")
        raise ScholarUpdateError(f"SearchApi returned HTTP {exc.code} ({hint}); no update saved") from exc
    except (URLError, OSError):
        # Provider/network error text may contain credentials; never include it in logs.
        raise ScholarUpdateError("Cannot reach SearchApi or the request timed out; no update saved") from None
    except (ValueError, UnicodeError):
        raise ScholarUpdateError("SearchApi returned invalid JSON; no update saved") from None


def parse_metrics(payload: dict, expected_author_id: str) -> dict[str, int]:
    """Validate the author response and read named rows from its explicit All column."""
    if not isinstance(payload, dict) or payload.get("error") or payload.get("errors"):
        raise ScholarUpdateError("SearchApi returned an error or invalid response")
    metadata = payload.get("search_metadata")
    if not isinstance(metadata, dict) or metadata.get("status") != "Success":
        raise ScholarUpdateError("SearchApi did not report a successful search")
    parameters = payload.get("search_parameters")
    if (
        not isinstance(parameters, dict)
        or parameters.get("engine") != "google_scholar_author"
        or parameters.get("author_id") != expected_author_id
    ):
        raise ScholarUpdateError("SearchApi returned a different author or search engine")
    cited_by = payload.get("cited_by")
    table = cited_by.get("table") if isinstance(cited_by, dict) else None
    if not isinstance(table, dict):
        raise ScholarUpdateError("SearchApi response has no citation statistics table")
    headers, rows = table.get("headers"), table.get("rows")
    if not isinstance(headers, list) or not isinstance(rows, list):
        raise ScholarUpdateError("Invalid citation statistics table")
    all_columns = [
        index for index, value in enumerate(headers)
        if isinstance(value, str) and value.strip().casefold() == "all"
    ]
    if len(all_columns) != 1 or all_columns[0] == 0:
        raise ScholarUpdateError("Citation statistics must have one explicit All column")
    row_names = {"citations": "citations", "h-index": "h_index"}
    metrics = {}
    for row in rows:
        if not isinstance(row, list) or not row or not isinstance(row[0], str):
            raise ScholarUpdateError("Invalid citation statistics row")
        key = row_names.get(row[0].strip().casefold())
        if key is None:
            continue
        if key in metrics or len(row) != len(headers):
            raise ScholarUpdateError(f"Missing or ambiguous statistics cells for {key}")
        raw_value = str(row[all_columns[0]]).strip()
        if not re.fullmatch(r"(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)", raw_value):
            raise ScholarUpdateError(f"Invalid nonnegative integer for {key}")
        metrics[key] = int(raw_value.replace(",", ""))
    if metrics.keys() != {"citations", "h_index"}:
        raise ScholarUpdateError("Google Scholar statistics are missing Citations or h-index")
    return metrics


def response_date(payload: dict) -> str:
    """Use the provider's response date, so cached data is not relabeled as fresh."""
    timestamp = payload.get("search_metadata", {}).get("created_at")
    try:
        if not isinstance(timestamp, str):
            raise ValueError("missing timestamp")
        checked_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        if checked_at.tzinfo is None:
            raise ValueError("timestamp must include a timezone")
    except ValueError:
        raise ScholarUpdateError("SearchApi response has no valid timezone-aware creation time") from None
    return checked_at.astimezone(timezone.utc).date().isoformat()


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
    payload = fetch_profile(profile_url)
    author_id = parse_qs(urlsplit(profile_url).query)["user"][0]
    metrics = parse_metrics(payload, author_id)
    snapshot = {
        "citations": metrics["citations"],
        "h_index": metrics["h_index"],
        "updated_at": response_date(payload),
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
