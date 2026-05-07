#!/usr/bin/env bash
# One-shot: install Deno if missing, cache sharp, run script.ts (no deno.lock).
# From this directory: ./setup-and-run.sh <input-image> <output.webp>
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="${HERE}/script.ts"
CONFIG="${HERE}/deno.json"

if [[ ! -f "$SCRIPT" ]]; then
  echo "Missing ${SCRIPT}" >&2
  exit 1
fi

if ! command -v deno >/dev/null 2>&1; then
  echo "Installing Deno (one-time)..."
  curl -fsSL https://deno.land/install.sh | sh
  DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
  export DENO_INSTALL
  export PATH="${DENO_INSTALL}/bin:${PATH}"
fi

echo "Caching dependencies..."
deno cache --no-lock --config="${CONFIG}" "${SCRIPT}"

echo "Running optimize-image..."
exec deno run \
  -A \
  --no-lock \
  --config="${CONFIG}" \
  "${SCRIPT}" "$@"
