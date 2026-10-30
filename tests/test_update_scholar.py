"""Offline tests for SearchApi metrics and last-successful-snapshot safety."""

from copy import deepcopy
from email.message import Message
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit

from scripts import update_scholar as scholar


FIXTURES = Path(__file__).parent / "fixtures" / "scholar"
PROFILE = json.loads((FIXTURES / "profile.json").read_text(encoding="utf-8"))
AUTHOR_ID = "exampleID"
PROFILE_URL = f"https://scholar.google.com/citations?user={AUTHOR_ID}&hl=en"
API_URL = "https://www.searchapi.io/api/v1/search"
TEST_KEY = "synthetic-test-key-do-not-use"


def profile():
    return deepcopy(PROFILE)


def response_for(body=None, status=200):
    response = MagicMock()
    response.__enter__.return_value = response
    response.status = status
    response.headers = Message()
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    response.read.return_value = json.dumps(PROFILE).encode("utf-8") if body is None else body
    return response


class ParseMetricsTests(unittest.TestCase):
    def test_all_column_named_rows_and_thousands(self):
        self.assertEqual(scholar.parse_metrics(PROFILE, AUTHOR_ID), {"citations": 1234, "h_index": 9})
        payload = profile()
        payload["cited_by"]["table"]["rows"].reverse()
        self.assertEqual(scholar.parse_metrics(payload, AUTHOR_ID), {"citations": 1234, "h_index": 9})

    def test_all_header_determines_column(self):
        payload = profile()
        payload["cited_by"]["table"]["headers"] = ["", "Since 2021", "All"]
        self.assertEqual(scholar.parse_metrics(payload, AUTHOR_ID), {"citations": 876, "h_index": 6})

    def test_zero_and_json_integers_are_valid(self):
        for citations, h_index in ((0, 0), (1234, 9), ("0", "0")):
            payload = profile()
            rows = payload["cited_by"]["table"]["rows"]
            rows[0][1], rows[1][1] = citations, h_index
            with self.subTest(citations=citations):
                self.assertEqual(
                    scholar.parse_metrics(payload, AUTHOR_ID),
                    {"citations": int(citations), "h_index": int(h_index)},
                )

    def test_invalid_integers_are_rejected(self):
        for value in (-1, 1.0, 1.5, True, False, None, [], {}, "-1", "1.5", "12,34", "1K", "", "N/A", "1 234", "+12", "1,234,56"):
            for row_index in (0, 1):
                payload = profile()
                payload["cited_by"]["table"]["rows"][row_index][1] = value
                with self.subTest(value=value, row=row_index), self.assertRaises(scholar.ScholarUpdateError):
                    scholar.parse_metrics(payload, AUTHOR_ID)

    def test_unsuccessful_or_wrong_author_responses_are_rejected(self):
        responses = [None, [], {}, {"error": "Invalid API key"}]
        for field, value in (
            ("error", "Upstream error despite a statistics table"),
            ("search_metadata", {}),
            ("search_metadata", {"status": "Error"}),
            ("search_metadata", {"status": "Processing"}),
            ("search_parameters", {}),
            ("search_parameters", {"engine": "google_scholar_author", "author_id": "someoneElse"}),
            ("search_parameters", {"engine": "google_scholar", "author_id": AUTHOR_ID}),
        ):
            payload = profile()
            payload[field] = value
            responses.append(payload)
        for payload in responses:
            with self.subTest(payload=payload), self.assertRaises(scholar.ScholarUpdateError):
                scholar.parse_metrics(payload, AUTHOR_ID)

    def test_missing_or_ambiguous_statistics_are_rejected(self):
        base = PROFILE["cited_by"]["table"]
        invalid_tables = [None, {}, {"headers": base["headers"]}, {"rows": base["rows"]}]
        for headers in (
            None, "All", ["", "Since 2020", "Since 2021"],
            ["", "全部", "Since 2021"], ["", "All", "All"], ["All", "", "Since 2021"],
        ):
            invalid_tables.append({"headers": headers, "rows": base["rows"]})
        for rows in (
            None, {}, [], base["rows"][:1],
            base["rows"] + [base["rows"][0]],
            [["Citations", "1,234"], base["rows"][1]],
            [["Citations", "1,234", "876", "extra"], base["rows"][1]],
            [["Citations", "1,234", "876"], ["different metric", "9", "6"]],
        ):
            invalid_tables.append({"headers": base["headers"], "rows": rows})
        for table in invalid_tables:
            payload = profile()
            payload["cited_by"]["table"] = table
            with self.subTest(table=table), self.assertRaises(scholar.ScholarUpdateError):
                scholar.parse_metrics(payload, AUTHOR_ID)


class FetchProfileTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict(scholar.os.environ, {"SEARCHAPI_API_KEY": TEST_KEY}, clear=True)
        environment.start()
        self.addCleanup(environment.stop)

    @patch.object(scholar, "build_opener")
    def test_single_get_uses_bearer_without_proxy_redirect_or_key_in_url(self, build_opener):
        opener = build_opener.return_value
        opener.open.return_value = response_for()
        self.assertEqual(scholar.fetch_profile(PROFILE_URL), PROFILE)
        opener.open.assert_called_once()
        request = opener.open.call_args.args[0]
        parts = urlsplit(request.full_url)
        self.assertEqual(f"{parts.scheme}://{parts.netloc}{parts.path}", API_URL)
        self.assertEqual(parse_qs(parts.query), {
            "engine": ["google_scholar_author"], "author_id": [AUTHOR_ID], "hl": ["en"],
        })
        self.assertEqual(request.get_header("Authorization"), f"Bearer {TEST_KEY}")
        self.assertNotIn(TEST_KEY, request.full_url)
        self.assertEqual(request.get_method(), "GET")
        self.assertEqual(opener.open.call_args.kwargs["timeout"], 110)
        handlers = build_opener.call_args.args
        self.assertTrue(any(getattr(handler, "proxies", None) == {} for handler in handlers))
        redirects = [handler for handler in handlers if isinstance(handler, scholar.NoRedirect)]
        self.assertEqual(len(redirects), 1)
        self.assertIsNone(redirects[0].redirect_request(None, None, 302, "", {}, "/other"))

    def test_missing_or_invalid_key_does_not_make_a_request(self):
        for value in (None, "", "  ", "bad\nkey", "non-ascii-密钥"):
            environment = {} if value is None else {"SEARCHAPI_API_KEY": value}
            with self.subTest(value=value), patch.dict(scholar.os.environ, environment, clear=True):
                with patch.object(scholar, "build_opener") as build_opener:
                    with self.assertRaises(scholar.ScholarUpdateError):
                        scholar.fetch_profile(PROFILE_URL)
                    build_opener.return_value.open.assert_not_called()

    def test_network_and_http_failures_are_not_retried(self):
        errors = [URLError("offline"), TimeoutError("timed out")]
        errors += [HTTPError(API_URL, code, "failed", {}, None) for code in (302, 401, 403, 429, 500, 502, 503)]
        for error in errors:
            with self.subTest(error=error), patch.object(scholar, "build_opener") as build_opener:
                opener = build_opener.return_value
                opener.open.side_effect = error
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.fetch_profile(PROFILE_URL)
                opener.open.assert_called_once()

    def test_invalid_json_responses_are_rejected(self):
        for body in (b"<html>Access denied</html>", b"{broken"):
            with self.subTest(body=body), patch.object(scholar, "build_opener") as build_opener:
                build_opener.return_value.open.return_value = response_for(body)
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.fetch_profile(PROFILE_URL)
                build_opener.return_value.open.assert_called_once()


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
        environment = patch.dict(scholar.os.environ, {"SEARCHAPI_API_KEY": TEST_KEY}, clear=True)
        environment.start()
        self.addCleanup(environment.stop)

    def assert_snapshot_untouched(self):
        self.assertEqual(self.output.read_bytes(), self.original)
        self.assertFalse(list(self.directory.glob(".scholar.json.*.tmp")))

    def test_profile_url_reuses_author_id_and_forces_english(self):
        self.assertEqual(scholar.read_profile_url(self.config), PROFILE_URL)

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

    @patch.object(scholar, "fetch_profile", return_value=PROFILE)
    def test_success_updates_all_fields_using_response_date(self, fetch):
        expected = {"citations": 1234, "h_index": 9, "updated_at": "2026-10-29"}
        self.assertEqual(scholar.update_scholar(self.config, self.output), expected)
        self.assertEqual(json.loads(self.output.read_text(encoding="utf-8")), expected)
        fetch.assert_called_once_with(PROFILE_URL)
        self.assertFalse(list(self.directory.glob(".scholar.json.*.tmp")))

    def test_response_timestamp_is_converted_to_utc_not_the_current_date(self):
        for timestamp, expected_date in (
            ("2026-10-29T00:01:00+08:00", "2026-10-28"),
            ("2026-10-29T23:59:00-02:00", "2026-10-30"),
            ("2020-01-02T00:01:00Z", "2020-01-02"),
        ):
            payload = profile()
            payload["search_metadata"]["created_at"] = timestamp
            with self.subTest(timestamp=timestamp), patch.object(scholar, "fetch_profile", return_value=payload):
                snapshot = scholar.update_scholar(self.config, self.output)
                self.assertEqual(snapshot["updated_at"], expected_date)
                self.assertEqual(json.loads(self.output.read_text())["updated_at"], expected_date)

    def test_invalid_or_naive_response_date_preserves_file(self):
        for timestamp in ("missing", None, "", "not a date", "2026-10-29", "2026-10-29T00:01:00", "2026-13-29T00:01:00Z", "2026-02-30T00:01:00Z", 123, []):
            payload = profile()
            if timestamp == "missing":
                del payload["search_metadata"]["created_at"]
            else:
                payload["search_metadata"]["created_at"] = timestamp
            with self.subTest(timestamp=timestamp), patch.object(scholar, "fetch_profile", return_value=payload):
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.update_scholar(self.config, self.output)
                self.assert_snapshot_untouched()

    def test_zero_and_decreases_can_replace_old_data(self):
        for citations, h_index in ((800, 6), (0, 0)):
            payload = profile()
            rows = payload["cited_by"]["table"]["rows"]
            rows[0][1], rows[1][1] = citations, h_index
            with self.subTest(citations=citations), patch.object(scholar, "fetch_profile", return_value=payload):
                scholar.update_scholar(self.config, self.output)
                snapshot = json.loads(self.output.read_text(encoding="utf-8"))
                self.assertEqual(snapshot, {"citations": citations, "h_index": h_index, "updated_at": "2026-10-29"})

    def test_missing_key_preserves_existing_snapshot(self):
        with patch.dict(scholar.os.environ, {}, clear=True), patch.object(scholar, "build_opener") as build_opener:
            with self.assertRaises(scholar.ScholarUpdateError):
                scholar.update_scholar(self.config, self.output)
            build_opener.return_value.open.assert_not_called()
        self.assert_snapshot_untouched()

    def test_http_and_network_failure_preserves_file_and_date(self):
        errors = [URLError("offline"), TimeoutError("timed out")]
        errors += [HTTPError(API_URL, code, "failed", {}, None) for code in (401, 403, 429, 500, 503)]
        for error in errors:
            with self.subTest(error=error), patch.object(scholar, "build_opener") as build_opener:
                build_opener.return_value.open.side_effect = error
                with self.assertRaises(scholar.ScholarUpdateError):
                    scholar.update_scholar(self.config, self.output)
                self.assert_snapshot_untouched()

    def test_invalid_response_preserves_file_and_date(self):
        wrong_author = profile()
        wrong_author["search_parameters"]["author_id"] = "someoneElse"
        invalid_count = profile()
        invalid_count["cited_by"]["table"]["rows"][0][1] = "-10"
        for payload in ({"error": "Upstream failure"}, {}, None, [], "unavailable", wrong_author, invalid_count):
            with self.subTest(payload=payload), patch.object(scholar, "fetch_profile", return_value=payload):
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

    @patch.object(scholar, "fetch_profile", return_value={"error": "Upstream failure"})
    def test_first_failure_does_not_create_a_snapshot(self, fetch):
        self.output.unlink()
        with self.assertRaises(scholar.ScholarUpdateError):
            scholar.update_scholar(self.config, self.output)
        self.assertFalse(self.output.exists())

    @patch.object(scholar, "fetch_profile", return_value={"error": "Upstream failure"})
    def test_cli_failure_is_nonzero_and_explains_failure(self, fetch):
        with patch("sys.stderr", new_callable=io.StringIO) as stderr:
            result = scholar.main(["--config", str(self.config), "--output", str(self.output)])
        self.assertEqual(result, 1)
        self.assertIn("Scholar update failed", stderr.getvalue())
        self.assert_snapshot_untouched()

    def test_failure_logs_do_not_expose_key_or_remote_error_text(self):
        private_text = f"remote-detail-{TEST_KEY}"
        invalid_count = profile()
        invalid_count["cited_by"]["table"]["rows"][0][1] = private_text
        failures = (
            URLError(private_text),
            HTTPError(API_URL, 401, private_text, {}, io.BytesIO(private_text.encode())),
            {"error": private_text},
            invalid_count,
        )
        for failure in failures:
            with self.subTest(kind=type(failure).__name__), patch.object(scholar, "build_opener") as build_opener:
                opener = build_opener.return_value
                if isinstance(failure, Exception):
                    opener.open.side_effect = failure
                else:
                    opener.open.return_value = response_for(json.dumps(failure).encode())
                with patch("sys.stderr", new_callable=io.StringIO) as stderr, patch("sys.stdout", new_callable=io.StringIO) as stdout:
                    result = scholar.main(["--config", str(self.config), "--output", str(self.output)])
                self.assertEqual(result, 1)
                self.assertNotIn(TEST_KEY, stderr.getvalue() + stdout.getvalue())
                self.assertNotIn("remote-detail-", stderr.getvalue() + stdout.getvalue())
                self.assert_snapshot_untouched()


if __name__ == "__main__":
    unittest.main()
