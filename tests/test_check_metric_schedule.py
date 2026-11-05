"""Offline checks for independent metric refresh dates and workflow events."""

from contextlib import redirect_stdout
from datetime import date
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts import check_metric_schedule as schedule


class RefreshScheduleTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.data_dir = Path(temporary.name)
        output = redirect_stdout(io.StringIO())
        output.__enter__()
        self.addCleanup(output.__exit__, None, None, None)

    def write_dates(self, scholar, huggingface):
        for name, value in (("scholar", scholar), ("huggingface", huggingface)):
            (self.data_dir / f"{name}.json").write_text(
                json.dumps({"updated_at": value}), encoding="utf-8",
            )

    def test_independent_dates_at_three_day_boundary(self):
        for scholar, huggingface, expected in (
            ("2026-11-03", "2026-11-03", (False, False, False)),
            ("2026-11-02", "2026-11-03", (True, True, False)),
            ("2026-11-03", "2026-11-02", (True, False, True)),
            ("2026-11-02", "2026-11-02", (True, True, True)),
            ("2026-11-05", "2026-11-05", (False, False, False)),
        ):
            with self.subTest(scholar=scholar, huggingface=huggingface):
                self.write_dates(scholar, huggingface)
                plan = schedule.refresh_plan("schedule", self.data_dir, date(2026, 11, 5))
                self.assertEqual(
                    (plan["should_run"], plan["refresh_scholar"], plan["refresh_huggingface"]),
                    expected,
                )

    def test_push_and_manual_runs_do_not_read_snapshot_dates(self):
        with patch.object(schedule, "snapshot_due") as read_snapshot:
            self.assertEqual(schedule.refresh_plan("push", self.data_dir), {
                "should_run": True, "refresh_scholar": False, "refresh_huggingface": False,
            })
            self.assertEqual(schedule.refresh_plan("workflow_dispatch", self.data_dir), {
                "should_run": True, "refresh_scholar": True, "refresh_huggingface": True,
            })
            read_snapshot.assert_not_called()

    def test_interval_across_month_year_and_leap_day_boundaries(self):
        for last_updated, today in (
            ("2026-10-30", date(2026, 11, 2)),
            ("2026-12-30", date(2027, 1, 2)),
            ("2028-02-27", date(2028, 3, 1)),
        ):
            with self.subTest(last_updated=last_updated):
                self.write_dates(last_updated, today.isoformat())
                plan = schedule.refresh_plan("schedule", self.data_dir, today)
                self.assertTrue(plan["refresh_scholar"])
                self.assertFalse(plan["refresh_huggingface"])

    def test_missing_invalid_and_future_dates_retry_only_affected_source(self):
        path = self.data_dir / "scholar.json"
        self.write_dates("2026-11-05", "2026-11-05")
        for raw in (
            None, b"not json", b"[]", b"null", b"{}", b"\xff",
            b'{"updated_at": 20261105}', b'{"updated_at": null}',
            b'{"updated_at": "2026-02-30"}', b'{"updated_at": "20261105"}',
            b'{"updated_at": "2026-11-05T00:00:00Z"}', b'{"updated_at": "2026-11-06"}',
        ):
            with self.subTest(raw=raw):
                if raw is None:
                    path.unlink(missing_ok=True)
                else:
                    path.write_bytes(raw)
                self.assertEqual(schedule.refresh_plan("schedule", self.data_dir, date(2026, 11, 5)), {
                    "should_run": True, "refresh_scholar": True, "refresh_huggingface": False,
                })

    def test_utc_clock_is_used_for_scheduled_checks(self):
        self.write_dates("2026-11-02", "2026-11-03")
        with patch.object(schedule, "datetime") as clock:
            clock.now.return_value.date.return_value = date(2026, 11, 5)
            plan = schedule.refresh_plan("schedule", self.data_dir)
        clock.now.assert_called_once_with(schedule.timezone.utc)
        self.assertTrue(plan["refresh_scholar"])
        self.assertFalse(plan["refresh_huggingface"])

    def test_cli_appends_boolean_outputs_for_github_actions(self):
        output_path = self.data_dir / "output"
        output_path.write_text("existing=value\n", encoding="utf-8")
        with patch.dict(schedule.os.environ, {"GITHUB_OUTPUT": str(output_path)}):
            self.assertEqual(schedule.main(["--event", "push"]), 0)
        self.assertEqual(output_path.read_text(encoding="utf-8"), (
            "existing=value\nshould_run=true\nrefresh_scholar=false\nrefresh_huggingface=false\n"
        ))


if __name__ == "__main__":
    unittest.main()
