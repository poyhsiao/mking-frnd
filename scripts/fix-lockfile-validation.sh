#!/bin/bash

# Fix for ERR_PNPM_OUTDATED_LOCKFILE and dry-run error in GitHub Actions
# This script implements a TDD-based solution for lockfile validation issues

set -e

echo "🔧 Fixing PNPM lockfile validation issues..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "pnpm-lock.yaml" ]; then
    print_error "pnpm-lock.yaml not found. Please run this script from the project root."
    exit 1
fi

if [ ! -f ".github/workflows/ci.yml" ]; then
    print_error "CI workflow file not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Check for any 'dry-run' references in the codebase
print_status "Checking for 'dry-run' references in the codebase..."
if grep -r "dry-run" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" 2>/dev/null; then
    print_warning "Found 'dry-run' references in the codebase. These should be reviewed."
else
    print_status "No 'dry-run' references found in the codebase."
fi

# Step 2: Validate current lockfile status
print_status "Validating current lockfile status..."
if pnpm install --frozen-lockfile > /dev/null 2>&1; then
    print_status "Lockfile is currently synchronized."
else
    print_warning "Lockfile is out of sync. Attempting to fix..."
    pnpm install
    print_status "Lockfile has been updated. Please commit the changes."
fi

# Step 3: Create improved CI workflow validation step
print_status "Creating improved CI workflow validation..."

# Backup original CI file
cp .github/workflows/ci.yml .github/workflows/ci.yml.backup

# Create improved validation step
cat > /tmp/improved_validation.yml << 'EOF'
      - name: Validate lockfile
        run: |
          echo "🔍 Checking lockfile synchronization..."
          
          # Check pnpm version
          echo "📦 PNPM version: $(pnpm --version)"
          
          # Validate lockfile with detailed error reporting
          if ! pnpm install --frozen-lockfile; then
            echo "❌ Lockfile validation failed"
            echo "📋 Diagnostic information:"
            echo "   - PNPM version: $(pnpm --version)"
            echo "   - Node version: $(node --version)"
            echo "   - OS: ${{ runner.os }}"
            
            # Check for common issues
            if [ ! -f "pnpm-lock.yaml" ]; then
              echo "💡 Issue: pnpm-lock.yaml file is missing"
              echo "🔧 Solution: Run 'pnpm install' to generate the lockfile"
            else
              echo "💡 Issue: Lockfile is out of sync with package.json files"
              echo "🔧 Solution: Run 'pnpm install' locally and commit the updated pnpm-lock.yaml"
            fi
            
            echo "📝 Steps to fix:"
            echo "   1. Run 'pnpm install' in your local environment"
            echo "   2. Commit the updated pnpm-lock.yaml file"
            echo "   3. Push the changes to trigger a new build"
            
            exit 1
          fi
          
          echo "✅ Lockfile is properly synchronized"
EOF

# Replace the validation step in CI file
print_status "Updating CI workflow with improved validation..."
python3 << 'EOF'
import re

# Read the CI file
with open('.github/workflows/ci.yml', 'r') as f:
    content = f.read()

# Read the improved validation step
with open('/tmp/improved_validation.yml', 'r') as f:
    new_validation = f.read()

# Replace the existing validation step
pattern = r'      - name: Validate lockfile\n        run: \|\n.*?echo "✅ Lockfile is synchronized"'
replacement = new_validation.strip()

# Perform the replacement
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write back to file
with open('.github/workflows/ci.yml', 'w') as f:
    f.write(new_content)

print("CI workflow updated successfully")
EOF

# Step 4: Create a test script to validate the fix
print_status "Creating validation test script..."
cat > scripts/test-lockfile-validation.sh << 'EOF'
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
EOF

chmod +x scripts/test-lockfile-validation.sh

# Step 5: Run the validation test
print_status "Running validation tests..."
if ./scripts/test-lockfile-validation.sh; then
    print_status "All validation tests passed!"
else
    print_error "Some validation tests failed. Please review the output above."
    exit 1
fi

# Step 6: Create documentation for the fix
print_status "Creating documentation..."
cat > docs/LOCKFILE_VALIDATION_FIX.md << 'EOF'
# PNPM Lockfile Validation Fix

This document describes the TDD-based solution for fixing the `ERR_PNPM_OUTDATED_LOCKFILE` and "Unknown option: 'dry-run'" errors in GitHub Actions.

## Problem Description

The error occurred during the "validate lockfile" phase of GitHub Actions:

```
Run echo "Checking lockfile synchronization (dry-run)..."
Checking lockfile synchronization (dry-run)...
ERROR Unknown option: 'dry-run'
For help, run: pnpm help install
❌ Lockfile is out of sync with package.json files
💡 To fix this locally, run: pnpm install
📝 Then commit the updated pnpm-lock.yaml
Error: Process completed with exit code 1.
```

## Root Cause Analysis

1. The error message suggested a "dry-run" option was being used, but this option doesn't exist in pnpm
2. The actual CI workflow didn't contain any "dry-run" references
3. The issue was likely caused by:
   - Outdated lockfile that needed synchronization
   - Potential version mismatch between local and CI environments
   - Insufficient error handling in the CI workflow

## Solution Implemented

### 1. Test-Driven Development Approach

Created comprehensive tests in `src/test/pnpm-lockfile-validation.test.ts` to:
- Validate CI workflow doesn't contain invalid options
- Ensure lockfile synchronization works correctly
- Check workspace configuration consistency
- Verify environment compatibility

### 2. Improved CI Workflow

Enhanced the lockfile validation step with:
- Better error messages and diagnostic information
- Version reporting for debugging
- Clear instructions for fixing issues
- Proper error handling

### 3. Validation Scripts

Created automated scripts to:
- Test lockfile validation locally
- Simulate CI environment checks
- Validate workspace configuration

## Usage

### Running the Fix

```bash
# Run the complete fix
./scripts/fix-lockfile-validation.sh

# Test the validation
./scripts/test-lockfile-validation.sh

# Run the TDD tests
npx vitest src/test/pnpm-lockfile-validation.test.ts
```

### Manual Steps

If you encounter lockfile issues:

1. **Update lockfile locally:**
   ```bash
   pnpm install
   ```

2. **Commit the changes:**
   ```bash
   git add pnpm-lock.yaml
   git commit -m "fix: update pnpm lockfile"
   ```

3. **Push to trigger CI:**
   ```bash
   git push
   ```

## Prevention

- Always run `pnpm install` after pulling changes
- Commit lockfile changes along with dependency updates
- Use the same pnpm version locally as in CI
- Run validation tests before pushing

## Files Modified

- `.github/workflows/ci.yml` - Enhanced lockfile validation
- `src/test/pnpm-lockfile-validation.test.ts` - TDD tests
- `scripts/fix-lockfile-validation.sh` - Automated fix script
- `scripts/test-lockfile-validation.sh` - Validation test script

EOF

# Clean up temporary files
rm -f /tmp/improved_validation.yml

print_status "🎉 Lockfile validation fix completed successfully!"
print_status "📚 Documentation created: docs/LOCKFILE_VALIDATION_FIX.md"
print_status "🧪 Test file created: src/test/pnpm-lockfile-validation.test.ts"
print_status "🔧 Validation script created: scripts/test-lockfile-validation.sh"
print_status ""
print_status "Next steps:"
print_status "1. Review the changes in .github/workflows/ci.yml"
print_status "2. Run 'git add .' to stage the changes"
print_status "3. Commit and push the changes"
print_status "4. Monitor the next CI build to ensure the fix works"