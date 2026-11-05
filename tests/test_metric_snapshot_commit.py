"""Exercise the workflow's save step with local repositories and no network."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]


class SnapshotCommitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        workflow = yaml.load(
            (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8"),
            Loader=yaml.BaseLoader,
        )
        cls.save_script = next(
            step["run"] for step in workflow["jobs"]["build"]["steps"]
            if step["name"] == "Save successfully built metric snapshots"
        )

    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.repo = Path(temporary.name) / "checkout"
        self.repo.mkdir()
        self.remote = Path(temporary.name) / "origin.git"
        self.git("init")
        self.git("symbolic-ref", "HEAD", "refs/heads/master")
        self.git("config", "user.name", "Metric test")
        self.git("config", "user.email", "metric-test@example.invalid")
        self.git("config", "commit.gpgsign", "false")
        self.git("config", "core.hooksPath", "/dev/null")
        (self.repo / "_data").mkdir()
        self.write("_data/scholar.json", "old scholar")
        self.write("notes.txt", "unrelated content")
        self.git("add", "--", "_data/scholar.json", "notes.txt")
        self.git("commit", "-m", "Initial snapshot")
        self.git("init", "--bare", str(self.remote))
        self.git("remote", "add", "origin", str(self.remote))
        self.git("push", "origin", "HEAD:master")
        self.initial_sha = self.git("rev-parse", "HEAD")

    def git(self, *arguments):
        result = subprocess.run(
            ["git", *arguments], cwd=self.repo, text=True, capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result.stdout.strip()

    def write(self, path, value):
        (self.repo / path).write_text(value + "\n", encoding="utf-8")

    def save(self, scholar, huggingface):
        environment = {**os.environ, "SCHOLAR_RESULT": scholar, "HUGGINGFACE_RESULT": huggingface}
        result = subprocess.run(
            ["bash", "-e", "-o", "pipefail", "-c", self.save_script],
            cwd=self.repo, env=environment, text=True, capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def assert_published_paths(self, expected):
        self.assertNotEqual(self.git("rev-parse", "HEAD"), self.initial_sha)
        self.assertEqual(self.git("rev-list", "--count", "HEAD"), "2")
        changed = self.git("show", "--pretty=format:", "--name-only", "HEAD").splitlines()
        self.assertEqual(set(changed), set(expected))
        self.assertEqual(
            self.git("rev-parse", "HEAD"),
            self.git("--git-dir", str(self.remote), "rev-parse", "refs/heads/master"),
        )

    def assert_no_new_commit(self):
        self.assertEqual(self.git("rev-parse", "HEAD"), self.initial_sha)
        self.assertEqual(
            self.git("--git-dir", str(self.remote), "rev-parse", "refs/heads/master"),
            self.initial_sha,
        )

    def test_scholar_publishes_when_first_huggingface_fetch_fails_without_a_file(self):
        self.write("_data/scholar.json", "new scholar")
        self.write("notes.txt", "unrelated staged change")
        self.git("add", "--", "notes.txt")
        self.assertFalse((self.repo / "_data/huggingface.json").exists())
        self.save("success", "failure")
        self.assert_published_paths(["_data/scholar.json"])
        self.assertEqual(self.git("diff", "--cached", "--name-only"), "notes.txt")

    def test_huggingface_publishes_without_including_a_failed_scholar_source(self):
        self.write("_data/scholar.json", "must not be committed")
        self.write("_data/huggingface.json", "new huggingface")
        self.save("failure", "success")
        self.assert_published_paths(["_data/huggingface.json"])
        self.assertEqual(self.git("show", "HEAD:_data/scholar.json"), "old scholar")

    def test_two_successful_sources_are_published_together(self):
        self.write("_data/scholar.json", "new scholar")
        self.write("_data/huggingface.json", "new huggingface")
        self.save("success", "success")
        self.assert_published_paths(["_data/scholar.json", "_data/huggingface.json"])

    def test_failed_or_skipped_sources_create_no_commit(self):
        self.write("_data/scholar.json", "must not be committed")
        for scholar, huggingface in (("failure", "failure"), ("skipped", "skipped"), ("failure", "skipped")):
            with self.subTest(scholar=scholar, huggingface=huggingface):
                self.save(scholar, huggingface)
                self.assert_no_new_commit()

    def test_unchanged_successful_snapshot_creates_no_commit(self):
        self.save("success", "failure")
        self.assert_no_new_commit()

    def test_absent_successful_source_is_not_passed_to_git(self):
        self.save("failure", "success")
        self.assert_no_new_commit()
        self.write("_data/scholar.json", "new scholar")
        self.save("success", "success")
        self.assert_published_paths(["_data/scholar.json"])


if __name__ == "__main__":
    unittest.main()
