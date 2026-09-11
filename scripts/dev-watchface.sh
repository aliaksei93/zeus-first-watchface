#!/usr/bin/env bash

set -eu
set -o pipefail

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET=${ZEPP_TARGET:-480x480-amazfit-balance-2}
LOG_DIR=${ZEPP_LOG_DIR:-/tmp/retro-digital-watchface}
LOG_FILE=${ZEPP_LOG_FILE:-$LOG_DIR/zeus-dev.log}

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"

echo "Zeus dev log: $LOG_FILE"
zeus dev -t "$TARGET" 2>&1 | tee "$LOG_FILE"
