#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHECKER = ROOT / "scripts" / "check_prompt.py"


class PromptCheckerTests(unittest.TestCase):
    def run_checker(self, name: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(CHECKER),
                str(ROOT / "tests" / name),
                "--mode",
                "text-free",
                "--ratio",
                "5:2",
            ],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_valid_prompt_passes_without_warnings(self) -> None:
        result = self.run_checker("valid-text-free.txt")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Result: PASS (0 warning(s))", result.stdout)

    def test_vague_prompt_fails(self) -> None:
        result = self.run_checker("invalid-vague.txt")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("aspect ratio 5:2 is missing", result.stdout)
        self.assertIn("text-free mode requires", result.stdout)
        self.assertIn("possible vague quality words", result.stdout)


if __name__ == "__main__":
    unittest.main()
