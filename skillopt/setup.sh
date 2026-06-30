#!/usr/bin/env bash
#
# One-time setup for the SkillOpt integration.
# Creates a local Python venv, installs skillopt, and fetches the prompt files
# the wheel forgets to ship. Safe to re-run (idempotent).
#
#   bash skillopt/setup.sh
#
set -euo pipefail

# Always run from the goose-skills repo root (this script lives in skillopt/).
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
VENV="$ROOT/skillopt-venv"   # gitignored

echo "==> Python: $(python3 --version)"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found. Install Python 3.10+ first." >&2
  exit 1
fi

echo "==> Creating venv at $VENV"
python3 -m venv "$VENV"

echo "==> Installing dependencies (skillopt)"
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$ROOT/skillopt/requirements.txt"

echo "==> Fetching prompt files (skillopt 0.1.0 ships none — known packaging gap)"
"$VENV/bin/python" "$ROOT/skillopt/fetch_prompts.py"

echo ""
echo "============================================================"
echo " Setup complete."
echo "============================================================"
echo ""
echo " Prerequisites to verify yourself:"
echo "   1. Claude CLI logged in       ->  claude   (then /login if needed)"
echo "      Both the 'tutor' and 'student' run through this — no API key used."
echo "   2. (Optional) real Meta data  ->  put META_ADS_TOKEN in goose-skills/.env"
echo "      Only needed to capture a REAL test snapshot; synthetic works without it."
echo ""
echo " Try it:"
echo "   ./skillopt-venv/bin/python skillopt/make_dataset.py                       # build questions"
echo "   ./skillopt-venv/bin/python skillopt/run.py --smoke                        # 1 cheap check"
echo "   ./skillopt-venv/bin/python skillopt/run.py                                # optimize"
echo "   ./skillopt-venv/bin/python skillopt/report.py skillopt/outputs/meta_ads_poc --open   # UI"
echo ""
