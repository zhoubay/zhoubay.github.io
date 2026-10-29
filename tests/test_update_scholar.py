"""Offline regression tests for metrics selection and last-successful-data safety."""

from datetime import datetime, timezone
from email.message import Message
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError

from scripts import update_scholar as scholar


FIXTURES = Path(__file__).parent / "fixtures" / "scholar"
PROFILE = (FIXTURES / "profile.html").read_text(encoding="utf-8")
CHALLENGE = (FIXTURES / "challenge.html").read_text(encoding="utf-8")


class ParseMetricsTests(unittest.TestCase):
    def test_all_column_named_rows_and_thousands(self):
        self.assertEqual(scholar.parse_metrics(PROFILE), {"citations": 1234, "h_index": 9})
        reversed_rows = PROFILE.replace(
            '<tr><td><a href="#">Citations</a></td><td>1,234</td><td>876</td></tr>\n'
            '<tr><td><a href="#">h-index</a></td><td>9</td><td>6</td></tr>',
            '<tr><td><a href="#">h-index</a></td><td>9</td><td>6</td></tr>\n'
            '<tr><td><a href="#">Citations</a></td><td>1,234</td><td>876</td></tr>',
        )
        self.assertEqual(scholar.parse_metrics(reversed_rows), {"citations": 1234, "h_index": 9})

    def test_all_header_determines_column(self):
        reordered = PROFILE.replace("<th>All</th><th>Since 2021</th>", "<th>Since 2021</th><th>All</th>")
        self.assertEqual(scholar.parse_metrics(reordered), {"citations": 876, "h_index": 6})

    def test_zero_is_valid(self):
        html = PROFILE.replace("1,234", "0").replace("<td>9</td>", "<td>0</td>")
        self.assertEqual(scholar.parse_metrics(html), {"citations": 0, "h_index": 0})

    def test_invalid_integers_are_rejected(self):
        for value in ("-1", "1.5", "12,34", "1K", "", "N/A", "1 234", "+12", "1,234,56"):
            with self.subTest(value=value), self.assertRaises(scholar.ScholarUpdateError):
                scholar.parse_metrics(PROFILE.replace("1,234", value))

    def test_missing_ambiguous_or_non_english_statistics_are_rejected(self):
        for html in (
            "<html><body>Temporarily unavailable</body></html>",
            PROFILE.replace("h-index", "different metric"),
            PROFILE.replace("All", "Since 2020"),
            PROFILE.replace("All", "全部"),
            PROFILE.replace("Since 2021", "All"),
            PROFILE.replace("<td>1,234</td>", ""),
            PROFILE.replace("i10-index", "h-index"),
            PROFILE + PROFILE,
        ):
            with self.subTest(html=html), self.assertRaises(scholar.ScholarUpdateError):
                scholar.parse_metrics(html)

    def test_challenge_is_rejected_even_with_a_statistics_table(self):
        for html in (CHALLENGE, CHALLENGE + PROFILE):
            with self.subTest(html=html), self.assertRaisesRegex(scholar.ScholarUpdateError, "challenge"):
                scholar.parse_metrics(html)


class FetchProfileTests(unittest.TestCase):
    url = "https://scholar.google.com/citations?user=test&hl=en"

    def response(self, html=PROFILE):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = 200
        response.headers = Message()
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        response.read.return_value = html.encode("utf-8")
        return response

    @patch.object(scholar, "build_opener")
    def test_single_get_with_no_proxy_redirect_or_retry(self, build_opener):
        opener = build_opener.return_value
        opener.open.return_value = self.response()
        self.assertEqual(scholar.fetch_profile(self.url), PROFILE)
        opener.open.assert_called_once()
        request = opener.open.call_args.args[0]
        self.assertEqual(request.full_url, self.url)
        self.assertEqual(request.get_method(), "GET")
        self.assertEqual(opener.open.call_args.kwargs, {"timeout": 20})
        handlers = build_opener.call_args.args
        self.assertEqual(handlers[0].proxies, {})
        self.assertIsInstance(handlers[1], scholar.NoRedirect)
        self.assertIsNone(handlers[1].redirect_request(None, None, 302, "", {}, "/sorry/"))

    def test_network_and_http_failures_are_not_retried(self):
        errors = [URLError("offline"), TimeoutError("timed out")]
        errors += [HTTPError(self.url, code, "blocked", {}, None) for code in (302, 403, 429, 500)]
        for error in errors:
            with self.subTest(error=error), patch.object(scholar, "build_opener") as build_opener:
                opener = build_opener.return_value
                opener.open.side_effect = error
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.fetch_profile(self.url)
                opener.open.assert_called_once()


class SnapshotTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)
        self.config = self.directory / "_config.yml"
        self.config.write_text(
            'author:\n  googlescholar: "https://scholar.google.com/citations?user=exampleID&hl=zh-CN&sortby=pubdate"\n',
            encoding="utf-8",
        )
        self.output = self.directory / "scholar.json"
        self.original = b'{"citations": 909, "h_index": 7, "updated_at": "2026-10-28"}\n'
        self.output.write_bytes(self.original)

    def assert_snapshot_untouched(self):
        self.assertEqual(self.output.read_bytes(), self.original)
        self.assertFalse(list(self.directory.glob(".scholar.json.*.tmp")))

    def test_profile_url_reuses_author_id_and_forces_english(self):
        self.assertEqual(
            scholar.read_profile_url(self.config),
            "https://scholar.google.com/citations?user=exampleID&hl=en",
        )

    def test_invalid_config_does_not_make_a_request_or_change_snapshot(self):
        for content in (
            "author: {}", "author: null", "author: [", "[]", "author:\n  googlescholar: 123",
            "author:\n  googlescholar: https://example.com/citations?user=test",
            "author:\n  googlescholar: https://scholar.google.com/citations",
            "author:\n  googlescholar: https://scholar.google.com/citations?user=one&user=two",
        ):
            self.config.write_text(content, encoding="utf-8")
            with self.subTest(content=content), patch.object(scholar, "fetch_profile") as fetch:
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.update_scholar(self.config, self.output)
                fetch.assert_not_called()
                self.assert_snapshot_untouched()

    @patch.object(scholar, "datetime")
    @patch.object(scholar, "fetch_profile", return_value=PROFILE)
    def test_success_updates_all_fields_using_utc_date(self, fetch, clock):
        clock.now.return_value = datetime(2026, 10, 29, 0, 1, tzinfo=timezone.utc)
        expected = {"citations": 1234, "h_index": 9, "updated_at": "2026-10-29"}
        self.assertEqual(scholar.update_scholar(self.config, self.output), expected)
        self.assertEqual(json.loads(self.output.read_text(encoding="utf-8")), expected)
        clock.now.assert_called_once_with(timezone.utc)
        fetch.assert_called_once_with("https://scholar.google.com/citations?user=exampleID&hl=en")
        self.assertFalse(list(self.directory.glob(".scholar.json.*.tmp")))

    @patch.object(scholar, "datetime")
    def test_zero_and_decreases_can_replace_old_data(self, clock):
        clock.now.return_value = datetime(2026, 10, 29, tzinfo=timezone.utc)
        for citations, h_index in ((800, 6), (0, 0)):
            html = PROFILE.replace("1,234", str(citations)).replace("<td>9</td>", f"<td>{h_index}</td>")
            with self.subTest(citations=citations), patch.object(scholar, "fetch_profile", return_value=html):
                scholar.update_scholar(self.config, self.output)
                snapshot = json.loads(self.output.read_text(encoding="utf-8"))
                self.assertEqual(snapshot, {"citations": citations, "h_index": h_index, "updated_at": "2026-10-29"})

    def test_http_and_network_failure_preserves_file_and_date(self):
        for error in (URLError("offline"), TimeoutError("timed out"), HTTPError("", 403, "blocked", {}, None), HTTPError("", 429, "blocked", {}, None)):
            with self.subTest(error=error), patch.object(scholar, "build_opener") as build_opener:
                build_opener.return_value.open.side_effect = error
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.update_scholar(self.config, self.output)
                self.assert_snapshot_untouched()

    def test_malformed_or_challenge_response_preserves_file_and_date(self):
        for html in (CHALLENGE, "<html></html>", PROFILE.replace("1,234", "-10"), PROFILE.replace("h-index", "missing")):
            with self.subTest(html=html), patch.object(scholar, "fetch_profile", return_value=html):
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.update_scholar(self.config, self.output)
                self.assert_snapshot_untouched()

    @patch.object(scholar, "fetch_profile", return_value=PROFILE)
    def test_atomic_replace_failure_preserves_file_and_cleans_temporary(self, fetch):
        with patch.object(scholar.os, "replace", side_effect=OSError("read-only destination")):
            with self.assertRaises(scholar.ScholarUpdateError):
                scholar.update_scholar(self.config, self.output)
        self.assert_snapshot_untouched()

    @patch.object(scholar, "fetch_profile", return_value=PROFILE)
    def test_partial_temporary_write_failure_preserves_file_and_cleans_temporary(self, fetch):
        def failed_write(snapshot, handle, **kwargs):
            handle.write('{"citations":')
            raise OSError("disk full")

        with patch.object(scholar.json, "dump", side_effect=failed_write):
            with self.assertRaises(scholar.ScholarUpdateError):
                scholar.update_scholar(self.config, self.output)
        self.assert_snapshot_untouched()

    @patch.object(scholar, "fetch_profile", return_value=CHALLENGE)
    def test_first_failure_does_not_create_a_snapshot(self, fetch):
        self.output.unlink()
        with self.assertRaises(scholar.ScholarUpdateError):
            scholar.update_scholar(self.config, self.output)
        self.assertFalse(self.output.exists())

    @patch.object(scholar, "fetch_profile", return_value=CHALLENGE)
    def test_cli_failure_is_nonzero_and_explains_failure(self, fetch):
        with patch("sys.stderr", new_callable=io.StringIO) as stderr:
            result = scholar.main(["--config", str(self.config), "--output", str(self.output)])
        self.assertEqual(result, 1)
        self.assertIn("Scholar update failed", stderr.getvalue())
        self.assert_snapshot_untouched()


if __name__ == "__main__":
    unittest.main()
