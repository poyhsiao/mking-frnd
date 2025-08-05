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

