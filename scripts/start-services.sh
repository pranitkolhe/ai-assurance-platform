#!/bin/bash
# Start all five engine services in the background.
# Usage: ./scripts/start-services.sh
# Stop:  pkill -f "uvicorn main:app"  (or close the terminals)
#
# Each service needs its own venv + requirements first:
#   cd services/<service> && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
# If a service's venv is missing, this script prints a warning and
# skips that service instead of failing silently.
#
# Health check after starting:
#   curl http://127.0.0.1:8101/health  (and 8102, 8103, 8104, 8105)

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

start_one() {
  local name="$1" port="$2"
  local dir="$ROOT/services/$name"
  if [ ! -f "$dir/venv/bin/uvicorn" ] && [ ! -f "$dir/venv/bin/activate" ]; then
    echo "SKIP $name: no venv found in $dir -- run: cd $dir && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    return 0
  fi
  echo "Starting $name on port $port ..."
  (cd "$dir" && source venv/bin/activate && nohup uvicorn main:app --host 127.0.0.1 --port "$port" > "$dir/service.log" 2>&1 &)
}

start_one "data-integrity" 8101
start_one "model-integrity" 8102
start_one "backdoor-assessment" 8103
start_one "inference-provenance" 8104
start_one "distribution-shift" 8105

echo "Done. Check health with: curl http://127.0.0.1:8101/health"
