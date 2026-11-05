#!/usr/bin/env python3
"""Refresh cumulative Hugging Face downloads for the model repos shown on the site."""

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
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

import yaml


class HuggingFaceUpdateError(Exception):
    """An update failure that leaves the previous snapshot intact."""


class NoRedirect(HTTPRedirectHandler):
    """Require the configured repo to resolve directly on the public API."""

    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def read_repositories(config_path: Path) -> list[str]:
    """Use the same explicit repository IDs as the Community Impact cards."""
    try:
        items = yaml.safe_load(config_path.read_text(encoding="utf-8"))
        if not isinstance(items, list):
            raise ValueError("expected a list of Community Impact entries")
        repositories = []
        for item in items:
            if not isinstance(item, dict):
                raise ValueError("each Community Impact entry must be a mapping")
            if "huggingface_repo" not in item:
                continue
            repo_id = item["huggingface_repo"]
            if not isinstance(repo_id, str) or not re.fullmatch(
                r"[A-Za-z0-9][A-Za-z0-9._-]*/[A-Za-z0-9][A-Za-z0-9._-]*", repo_id
            ):
                raise ValueError("huggingface_repo must be a namespace/repository ID")
            if repo_id not in repositories:
                repositories.append(repo_id)
        if not repositories:
            raise ValueError("no huggingface_repo entries are configured")
        return repositories
    except (OSError, UnicodeError, yaml.YAMLError, ValueError) as exc:
        raise HuggingFaceUpdateError(f"Cannot read model repositories from {config_path}: {exc}") from exc


def fetch_model(repo_id: str) -> dict:
    """Fetch only the cumulative count; public repos require no API key or SDK."""
    api_url = f"https://huggingface.co/api/models/{repo_id}?" + urlencode({
        "expand[]": "downloadsAllTime",
    })
    request = Request(api_url, headers={
        "Accept": "application/json",
        "User-Agent": "zhoubay.github.io-metrics/1.0",
    }, method="GET")
    opener = build_opener(NoRedirect())
    try:
        with opener.open(request, timeout=30) as response:
            if response.status != 200:
                raise HuggingFaceUpdateError(f"{repo_id}: Hugging Face returned HTTP {response.status}")
            return json.loads(response.read())
    except HTTPError as exc:
        raise HuggingFaceUpdateError(
            f"{repo_id}: Hugging Face returned HTTP {exc.code}; no update saved"
        ) from exc
    except (URLError, OSError):
        raise HuggingFaceUpdateError(
            f"{repo_id}: cannot reach Hugging Face or the request timed out; no update saved"
        ) from None
    except (ValueError, UnicodeError):
        raise HuggingFaceUpdateError(f"{repo_id}: invalid JSON; no update saved") from None


def parse_downloads(payload: dict, expected_repo: str) -> int:
    """Never substitute a monthly count, a missing field, or another repo's count."""
    if not isinstance(payload, dict) or "error" in payload or "errors" in payload:
        raise HuggingFaceUpdateError(f"{expected_repo}: Hugging Face returned an error or invalid response")
    if payload.get("id") != expected_repo:
        raise HuggingFaceUpdateError(f"{expected_repo}: response repository ID does not match")
    downloads = payload.get("downloadsAllTime")
    if type(downloads) is not int or downloads < 0:
        raise HuggingFaceUpdateError(f"{expected_repo}: missing or invalid downloadsAllTime count")
    return downloads


def write_snapshot(output_path: Path, snapshot: dict) -> None:
    """Replace the snapshot only after all repos validate and the file is complete."""
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
        raise HuggingFaceUpdateError(f"Cannot save Hugging Face snapshot: {exc}") from exc
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def update_huggingface(config_path: Path, output_path: Path) -> dict:
    repositories = read_repositories(config_path)
    models = {}
    for repo_id in repositories:
        models[repo_id] = {"downloads_all_time": parse_downloads(fetch_model(repo_id), repo_id)}
    snapshot = {
        # The API exposes no timestamp for the counter: this is our successful check date.
        "updated_at": datetime.now(timezone.utc).date().isoformat(),
        "models": models,
    }
    write_snapshot(output_path, snapshot)
    return snapshot


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=Path("_data/community_impact.yml"))
    parser.add_argument("--output", type=Path, default=Path("_data/huggingface.json"))
    args = parser.parse_args(argv)
    try:
        snapshot = update_huggingface(args.config, args.output)
    except (HuggingFaceUpdateError, OSError) as exc:
        print(f"Hugging Face update failed: {exc}", file=sys.stderr)
        return 1
    for repo_id, metrics in snapshot["models"].items():
        print(f"{repo_id}: {metrics['downloads_all_time']:,} total downloads")
    print(f"Saved Hugging Face snapshot (checked {snapshot['updated_at']} UTC)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
