"""Offline checks for cumulative model downloads and snapshot failure safety."""

from datetime import datetime, timezone
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, call, patch
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit

from scripts import update_huggingface as huggingface


EVOLLA = "westlake-repl/Evolla-10B-hf"
SAPROT = "westlake-repl/SaProt_650M_AF2"
API_URL = f"https://huggingface.co/api/models/{EVOLLA}?expand%5B%5D=downloadsAllTime"
CONFIG = (
    '- title: "Another impact item"\n'
    f'- title: Evolla\n  huggingface_repo: {EVOLLA}\n'
    f'- title: SaProt\n  huggingface_repo: {SAPROT}\n'
)


def model(repo=EVOLLA, count=12345):
    return {"id": repo, "downloadsAllTime": count}


def response_for(body=None, status=200):
    response = MagicMock()
    response.__enter__.return_value = response
    response.status = status
    response.read.return_value = json.dumps(model()).encode("utf-8") if body is None else body
    return response


class ParseDownloadsTests(unittest.TestCase):
    def test_all_time_count_and_zero_are_accepted_without_monthly_fallback(self):
        for count in (0, 1, 12345):
            payload = model(count=count)
            payload["downloads"] = 999
            with self.subTest(count=count):
                self.assertEqual(huggingface.parse_downloads(payload, EVOLLA), count)

    def test_noninteger_negative_and_missing_counts_are_rejected(self):
        for count in (None, True, False, -1, 0.0, 1.5, "12345", "12,345", [], {}):
            with self.subTest(count=count), self.assertRaises(huggingface.HuggingFaceUpdateError):
                huggingface.parse_downloads(model(count=count), EVOLLA)
        with self.assertRaises(huggingface.HuggingFaceUpdateError):
            huggingface.parse_downloads({"id": EVOLLA, "downloads": 12345}, EVOLLA)

    def test_error_invalid_structure_and_different_repository_are_rejected(self):
        invalid = [None, [], {}, "unavailable", model(repo=SAPROT), model(repo=EVOLLA.lower())]
        invalid += [dict(model(), **{field: value}) for field in ("error", "errors") for value in (None, "", "provider failed", [])]
        for payload in invalid:
            with self.subTest(payload=payload), self.assertRaises(huggingface.HuggingFaceUpdateError):
                huggingface.parse_downloads(payload, EVOLLA)


class FetchModelTests(unittest.TestCase):
    @patch.object(huggingface, "build_opener")
    def test_public_get_requests_only_cumulative_downloads_without_credentials(self, build_opener):
        opener = build_opener.return_value
        opener.open.return_value = response_for()
        with patch.dict(huggingface.os.environ, {"HF_TOKEN": "unused-test-token"}):
            self.assertEqual(huggingface.fetch_model(EVOLLA), model())
        opener.open.assert_called_once()
        request = opener.open.call_args.args[0]
        parts = urlsplit(request.full_url)
        self.assertEqual(f"{parts.scheme}://{parts.netloc}{parts.path}", f"https://huggingface.co/api/models/{EVOLLA}")
        self.assertEqual(parse_qs(parts.query), {"expand[]": ["downloadsAllTime"]})
        self.assertEqual(request.get_method(), "GET")
        self.assertEqual(request.get_header("Accept"), "application/json")
        self.assertIsNone(request.get_header("Authorization"))
        self.assertNotIn("unused-test-token", request.full_url)
        self.assertEqual(opener.open.call_args.kwargs["timeout"], 30)
        handlers = build_opener.call_args.args
        redirects = [handler for handler in handlers if isinstance(handler, huggingface.NoRedirect)]
        self.assertEqual(len(redirects), 1)
        self.assertIsNone(redirects[0].redirect_request(None, None, 302, "", {}, "/elsewhere"))

    def test_http_network_and_timeout_failures_are_not_retried(self):
        errors = [URLError("offline"), TimeoutError("timed out")]
        errors += [HTTPError(API_URL, code, "failed", {}, None) for code in (302, 401, 403, 404, 429, 500, 503)]
        for error in errors:
            with self.subTest(error=error), patch.object(huggingface, "build_opener") as build_opener:
                build_opener.return_value.open.side_effect = error
                with self.assertRaises(huggingface.HuggingFaceUpdateError):
                    huggingface.fetch_model(EVOLLA)
                build_opener.return_value.open.assert_called_once()

    def test_non_success_status_and_invalid_json_are_rejected(self):
        responses = [response_for(status=status) for status in (204, 302, 429, 503)]
        responses += [response_for(body) for body in (b"<html>Access denied</html>", b"{broken", b"\xff")]
        for response in responses:
            with self.subTest(response=response), patch.object(huggingface, "build_opener") as build_opener:
                build_opener.return_value.open.return_value = response
                with self.assertRaises(huggingface.HuggingFaceUpdateError):
                    huggingface.fetch_model(EVOLLA)
                build_opener.return_value.open.assert_called_once()


class SnapshotTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)
        self.config = self.directory / "community_impact.yml"
        self.config.write_text(CONFIG, encoding="utf-8")
        self.output = self.directory / "huggingface.json"
        self.original = json.dumps({
            "updated_at": "2026-10-28",
            "models": {EVOLLA: {"downloads_all_time": 12345}, SAPROT: {"downloads_all_time": 54321}},
        }).encode() + b"\n"
        self.output.write_bytes(self.original)

    def assert_snapshot_untouched(self):
        self.assertEqual(self.output.read_bytes(), self.original)
        self.assertEqual(set(self.directory.iterdir()), {self.config, self.output})

    def test_config_ignores_other_cards_and_deduplicates_repository_ids(self):
        self.config.write_text(CONFIG + f'- huggingface_repo: {EVOLLA}\n', encoding="utf-8")
        self.assertEqual(huggingface.read_repositories(self.config), [EVOLLA, SAPROT])

    def test_invalid_config_does_not_request_or_change_snapshot(self):
        invalid = ["", "[]", "{}", "[", "null", "- title: No repositories", "- invalid string entry"]
        invalid += [f'- huggingface_repo: {value}' for value in (
            "null", "123", "true", "[]", "{}", '""', '"repo"', '"/repo"', '"owner/"',
            '"owner/repo/extra"', '"owner/repo?query=1"', '"owner/repo#part"',
            '"https://huggingface.co/owner/repo"', '"owner/repo name"', '"中文/repo"',
            '"owner/../repo"', '"owner/%2Frepo"',
        )]
        # Validate every entry before issuing requests, even if earlier entries were valid.
        invalid.append(CONFIG + '- huggingface_repo: "invalid"\n')
        for content in invalid:
            self.config.write_text(content, encoding="utf-8")
            with self.subTest(content=content), patch.object(huggingface, "fetch_model") as fetch:
                with self.assertRaises(huggingface.HuggingFaceUpdateError):
                    huggingface.update_huggingface(self.config, self.output)
                fetch.assert_not_called()
                self.assert_snapshot_untouched()

    def test_success_records_both_models_and_current_utc_date(self):
        expected = {
            "updated_at": "2026-11-05",
            "models": {EVOLLA: {"downloads_all_time": 23456}, SAPROT: {"downloads_all_time": 65432}},
        }
        with patch.object(huggingface, "fetch_model", side_effect=[model(count=23456), model(SAPROT, 65432)]) as fetch:
            with patch.object(huggingface, "datetime") as clock:
                clock.now.return_value = datetime(2026, 11, 5, 0, 1, tzinfo=timezone.utc)
                self.assertEqual(huggingface.update_huggingface(self.config, self.output), expected)
            clock.now.assert_called_once_with(timezone.utc)
        self.assertEqual(fetch.call_args_list, [call(EVOLLA), call(SAPROT)])
        self.assertEqual(json.loads(self.output.read_text(encoding="utf-8")), expected)
        self.assertEqual(set(self.directory.iterdir()), {self.config, self.output})

    def test_zero_and_decreasing_counts_replace_old_data(self):
        for counts in ((12000, 54000), (0, 0)):
            payloads = [model(EVOLLA, counts[0]), model(SAPROT, counts[1])]
            with self.subTest(counts=counts), patch.object(huggingface, "fetch_model", side_effect=payloads):
                snapshot = huggingface.update_huggingface(self.config, self.output)
                self.assertEqual(snapshot["models"], {
                    EVOLLA: {"downloads_all_time": counts[0]}, SAPROT: {"downloads_all_time": counts[1]},
                })
                self.assertEqual(json.loads(self.output.read_text(encoding="utf-8")), snapshot)

    def test_failure_of_second_repository_preserves_entire_snapshot_and_date(self):
        failures = [
            huggingface.HuggingFaceUpdateError("temporary failure"),
            {"error": "provider failed"},
            {"id": SAPROT, "downloads": 123},
            model(EVOLLA, 999),
            model(SAPROT, -1),
        ]
        for failure in failures:
            with self.subTest(failure=failure), patch.object(huggingface, "fetch_model", side_effect=[model(count=99999), failure]) as fetch:
                with self.assertRaises(huggingface.HuggingFaceUpdateError):
                    huggingface.update_huggingface(self.config, self.output)
                self.assertEqual(fetch.call_args_list, [call(EVOLLA), call(SAPROT)])
                self.assert_snapshot_untouched()

    def test_network_failure_on_second_request_preserves_entire_snapshot(self):
        for error in (URLError("offline"), TimeoutError("timed out"), HTTPError(API_URL, 429, "rate limited", {}, None)):
            with self.subTest(error=error), patch.object(huggingface, "build_opener") as build_opener:
                build_opener.return_value.open.side_effect = [response_for(), error]
                with self.assertRaises(huggingface.HuggingFaceUpdateError):
                    huggingface.update_huggingface(self.config, self.output)
                self.assertEqual(build_opener.return_value.open.call_count, 2)
                self.assert_snapshot_untouched()

    def test_atomic_replace_failure_preserves_file_and_cleans_temporary(self):
        with patch.object(huggingface, "fetch_model", side_effect=[model(), model(SAPROT)]):
            with patch.object(huggingface.os, "replace", side_effect=OSError("read-only destination")):
                with self.assertRaises(huggingface.HuggingFaceUpdateError):
                    huggingface.update_huggingface(self.config, self.output)
        self.assert_snapshot_untouched()

    def test_partial_write_failure_preserves_file_and_cleans_temporary(self):
        def failed_write(snapshot, handle, **kwargs):
            handle.write('{"updated_at":')
            raise OSError("disk full")

        with patch.object(huggingface, "fetch_model", side_effect=[model(), model(SAPROT)]):
            with patch.object(huggingface.json, "dump", side_effect=failed_write):
                with self.assertRaises(huggingface.HuggingFaceUpdateError):
                    huggingface.update_huggingface(self.config, self.output)
        self.assert_snapshot_untouched()

    def test_first_failure_does_not_create_snapshot(self):
        self.output.unlink()
        with patch.object(huggingface, "fetch_model", return_value={"error": "failed"}):
            with self.assertRaises(huggingface.HuggingFaceUpdateError):
                huggingface.update_huggingface(self.config, self.output)
        self.assertFalse(self.output.exists())

    def test_cli_failure_is_nonzero_without_remote_error_text(self):
        private_text = "remote-private-error-text"
        failures = (
            URLError(private_text), TimeoutError(private_text),
            HTTPError(API_URL, 401, private_text, {}, io.BytesIO(private_text.encode())),
            {"error": private_text}, model(count=private_text), {"id": private_text, "downloadsAllTime": 10},
        )
        for failure in failures:
            with self.subTest(kind=type(failure).__name__), patch.object(huggingface, "build_opener") as build_opener:
                if isinstance(failure, Exception):
                    build_opener.return_value.open.side_effect = failure
                else:
                    build_opener.return_value.open.return_value = response_for(json.dumps(failure).encode())
                with patch("sys.stderr", new_callable=io.StringIO) as stderr, patch("sys.stdout", new_callable=io.StringIO) as stdout:
                    result = huggingface.main(["--config", str(self.config), "--output", str(self.output)])
                self.assertEqual(result, 1)
                self.assertIn("Hugging Face update failed", stderr.getvalue())
                self.assertNotIn(private_text, stderr.getvalue() + stdout.getvalue())
                self.assert_snapshot_untouched()

    def test_cli_defaults_and_explicit_paths(self):
        for arguments, expected_config, expected_output in (
            ([], Path("_data/community_impact.yml"), Path("_data/huggingface.json")),
            (["--config", str(self.config), "--output", str(self.output)], self.config, self.output),
        ):
            with self.subTest(arguments=arguments), patch.object(huggingface, "update_huggingface", return_value=json.loads(self.original)) as update:
                with patch("sys.stdout", new_callable=io.StringIO):
                    self.assertEqual(huggingface.main(arguments), 0)
                update.assert_called_once_with(expected_config, expected_output)


if __name__ == "__main__":
    unittest.main()
