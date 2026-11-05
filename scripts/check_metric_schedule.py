#!/usr/bin/env python3
"""Decide which metric snapshots are due without making network requests."""

from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
import json
import os
from pathlib import Path
import re


SOURCES = {"scholar": "Google Scholar", "huggingface": "Hugging Face"}
REFRESH_INTERVAL_DAYS = 3


def snapshot_due(path: Path, label: str, today: date) -> bool:
    """Retry absent, invalid, future, or at least three-day-old snapshots."""
    try:
        snapshot = json.loads(path.read_text(encoding="utf-8"))
        updated_at = snapshot["updated_at"]
        if not isinstance(updated_at, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", updated_at):
            raise ValueError("expected a YYYY-MM-DD date")
        age = (today - date.fromisoformat(updated_at)).days
    except (OSError, UnicodeError, ValueError, KeyError, TypeError):
        print(f"::warning::{label} snapshot date is missing or invalid; requesting a fresh update.")
        return True
    if age < 0:
        print(f"::warning::{label} snapshot has a future date; requesting a fresh update.")
        return True
    due = age >= REFRESH_INTERVAL_DAYS
    print(f"{label} snapshot is {age} UTC calendar day(s) old; refresh due: {due}.")
    return due


def refresh_plan(event: str, data_dir: Path, today: date | None = None) -> dict[str, bool]:
    """Push only builds; manual runs refresh both; schedules check each source."""
    if event not in {"push", "schedule", "workflow_dispatch"}:
        raise ValueError(f"Unsupported workflow event: {event}")
    today = today or datetime.now(timezone.utc).date()
    refresh = {
        f"refresh_{source}": (
            snapshot_due(data_dir / f"{source}.json", label, today)
            if event == "schedule"
            else event == "workflow_dispatch"
        )
        for source, label in SOURCES.items()
    }
    return {"should_run": event != "schedule" or any(refresh.values()), **refresh}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--event", choices=("push", "schedule", "workflow_dispatch"), required=True)
    parser.add_argument("--data-dir", type=Path, default=Path("_data"))
    args = parser.parse_args(argv)
    plan = refresh_plan(args.event, args.data_dir)
    output = "".join(f"{name}={str(value).lower()}\n" for name, value in plan.items())
    print(output, end="")
    if output_path := os.environ.get("GITHUB_OUTPUT"):
        with open(output_path, "a", encoding="utf-8") as handle:
            handle.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
