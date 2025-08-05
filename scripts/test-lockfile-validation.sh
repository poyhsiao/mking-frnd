#!/bin/bash

# Test script to validate lockfile synchronization
# This script simulates the CI environment validation

set -e

echo "🧪 Testing lockfile validation..."

# Test 1: Check if lockfile exists
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "❌ Test failed: pnpm-lock.yaml not found"
    exit 1
fi
echo "✅ Test 1 passed: pnpm-lock.yaml exists"

# Test 2: Validate lockfile synchronization
if pnpm install --frozen-lockfile > /dev/null 2>&1; then
    echo "✅ Test 2 passed: Lockfile is synchronized"
else
    echo "❌ Test 2 failed: Lockfile is out of sync"
    exit 1
fi

# Test 3: Check for invalid options in CI
if grep -q "dry-run" .github/workflows/ci.yml; then
    echo "❌ Test 3 failed: Found 'dry-run' option in CI workflow"
    exit 1
fi
echo "✅ Test 3 passed: No invalid options found in CI workflow"

# Test 4: Validate workspace configuration
if [ -f "pnpm-workspace.yaml" ]; then
    echo "✅ Test 4 passed: Workspace configuration exists"
else
    echo "❌ Test 4 failed: pnpm-workspace.yaml not found"
    exit 1
fi

echo "🎉 All lockfile validation tests passed!"
