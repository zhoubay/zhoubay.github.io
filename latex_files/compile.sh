#!/usr/bin/env bash
# Usage:
#   ./compile.sh           # build all subprojects with main.tex
#   ./compile.sh cv        # build only latex_files/cv/
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v xelatex >/dev/null 2>&1; then
  echo "Error: xelatex not found. Install TeX Live with XeLaTeX support." >&2
  exit 1
fi

discover_projects() {
  local d name
  for d in "$ROOT"/*/; do
    [[ -d "$d" ]] || continue
    [[ -f "${d}main.tex" ]] || continue
    name="$(basename "$d")"
    echo "$name"
  done | sort
}

validate_project() {
  local dir="$1"
  local project_dir="$ROOT/$dir"

  if [[ ! -d "$project_dir" ]]; then
    echo "Error: project directory not found: $dir" >&2
    return 1
  fi
  if [[ ! -f "$project_dir/main.tex" ]]; then
    echo "Error: no main.tex in $dir/" >&2
    return 1
  fi
  return 0
}

compile_one() {
  local dir="$1"
  local MAIN=main.tex
  local BASE="${MAIN%.tex}"
  local PDF="${BASE}.pdf"

  echo "==> Building: $dir"

  (
    cd "$ROOT/$dir" || exit 1

    xelatex_pass() {
      xelatex -interaction=nonstopmode "$MAIN" || true
    }

    echo "    xelatex (pass 1)"
    xelatex_pass

    if command -v bibtex >/dev/null 2>&1 && grep -q '\\bibliography{' "$MAIN" 2>/dev/null; then
      echo "    bibtex"
      bibtex "$BASE" || true
      echo "    xelatex (pass 2)"
      xelatex_pass
      echo "    xelatex (pass 3)"
      xelatex_pass
    else
      echo "    xelatex (pass 2)"
      xelatex_pass
    fi

    if [[ ! -f "$PDF" ]]; then
      echo "Error: $dir/$PDF was not created. Check $dir/main.log for details." >&2
      exit 1
    fi

    echo "Done: $dir/$PDF"
  )
}

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [project]" >&2
  exit 1
fi

if [[ $# -eq 1 ]]; then
  project="$(basename "$1")"
  validate_project "$project" || exit 1
  compile_one "$project" || exit 1
  exit 0
fi

mapfile -t projects < <(discover_projects)

if [[ ${#projects[@]} -eq 0 ]]; then
  echo "Error: no subprojects with main.tex found under $ROOT" >&2
  exit 1
fi

failed=()
for p in "${projects[@]}"; do
  if ! compile_one "$p"; then
    failed+=("$p")
  fi
done

if [[ ${#failed[@]} -gt 0 ]]; then
  echo "Error: failed to build: ${failed[*]}" >&2
  exit 1
fi
