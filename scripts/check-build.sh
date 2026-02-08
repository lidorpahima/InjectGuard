#!/bin/bash
# Pre-deploy build check for Redacted Next.js app
# Usage: ./scripts/check-build.sh
# Exits with code 1 if build fails, 0 on success

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REDACTED_DIR="$PROJECT_ROOT/Redacted"

echo "🔍 Running pre-deploy build check for Redacted..."

if [ ! -d "$REDACTED_DIR" ]; then
    echo "❌ Error: Redacted directory not found at $REDACTED_DIR"
    exit 1
fi

cd "$REDACTED_DIR"

# Check if node_modules exists and next is available
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Verify next is available
if [ ! -f "node_modules/.bin/next" ]; then
    echo "❌ Error: Next.js not found after installation. Check npm install output."
    exit 1
fi

# Run build (npm run will use node_modules/.bin/next)
echo "🏗️  Building Next.js app..."
if npm run build; then
    echo "✅ Build successful! Ready for deployment."
    exit 0
else
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
fi
