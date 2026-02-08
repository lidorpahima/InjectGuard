#!/usr/bin/env bash
# Run backend API tests. Use after docker-compose up or in CI.
# Usage: ./scripts/run-tests.sh   (runs in Docker)
#        cd backend && pytest     (run locally with venv)

set -e
cd "$(dirname "$0")/.."

echo "Running backend tests..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose run --rm backend python -m pytest tests/ -v --tb=short
else
  (cd backend && python -m pytest tests/ -v --tb=short)
fi
