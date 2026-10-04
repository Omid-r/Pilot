#!/usr/bin/env bash
# Compatibility entry point for the offline release bundle.
# The canonical deployer lives in scripts/setup.sh.
set -euo pipefail
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
exec bash "${BASE}/scripts/setup.sh" "$@"
