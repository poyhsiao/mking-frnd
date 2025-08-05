#!/bin/bash

# Validate PNPM Lockfile Synchronization
# Quick script to check if lockfile is in sync with package.json files

set -e

echo "🔍 Validating PNPM Lockfile Synchronization"
echo "==========================================="

# Test 1: Run specifier mismatch tests
echo "Test 1: Running specifier mismatch detection..."
if npx vitest src/test/pnpm-specifier-mismatch.test.ts --run --reporter=basic; then
    echo "✅ Specifier tests passed"
else
    echo "❌ Specifier tests failed"
    exit 1
fi

# Test 2: Frozen lockfile validation
echo "Test 2: Testing frozen lockfile..."
if pnpm install --frozen-lockfile; then
    echo "✅ Frozen lockfile validation passed"
else
    echo "❌ Frozen lockfile validation failed"
    exit 1
fi

# Test 3: Check for common issues
echo "Test 3: Checking for common lockfile issues..."
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "❌ pnpm-lock.yaml not found"
    exit 1
fi

if grep -q "dry-run" pnpm-lock.yaml; then
    echo "❌ Invalid 'dry-run' found in lockfile"
    exit 1
fi

echo "✅ All validation tests passed"
echo "🎉 Lockfile is properly synchronized"
