#!/usr/bin/env bash
# Direct alias to setup.sh
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
exec bash "${DIR}/setup.sh" "$@"
