#!/usr/bin/env bash
set -euo pipefail

echo "Running UpVid unit tests..."
npx --yes tsx --test src/utils/studioLogic.test.ts

echo "Running TypeScript typecheck..."
npm run lint

echo "Building production bundle..."
npm run build

echo "All UpVid checks passed."
