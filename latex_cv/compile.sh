#!/usr/bin/env bash
set -uo pipefail

cd "$(dirname "$0")"

MAIN=main.tex
BASE="${MAIN%.tex}"
PDF="${BASE}.pdf"

if ! command -v xelatex >/dev/null 2>&1; then
  echo "Error: xelatex not found. Install TeX Live with XeLaTeX support." >&2
  exit 1
fi

xelatex_pass() {
  xelatex -interaction=nonstopmode "$MAIN" || true
}

echo "==> xelatex (pass 1)"
xelatex_pass

if command -v bibtex >/dev/null 2>&1 && grep -q '\\bibliography{' "$MAIN" 2>/dev/null; then
  echo "==> bibtex"
  bibtex "$BASE" || true
  echo "==> xelatex (pass 2)"
  xelatex_pass
  echo "==> xelatex (pass 3)"
  xelatex_pass
else
  echo "==> xelatex (pass 2)"
  xelatex_pass
fi

if [[ ! -f "$PDF" ]]; then
  echo "Error: $PDF was not created. Check main.log for details." >&2
  exit 1
fi

echo "Done: $PDF"
