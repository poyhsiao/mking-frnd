# PNPM Specifier Mismatch Fix

## Problem Description

The `ERR_PNPM_OUTDATED_LOCKFILE` error occurs when the specifiers in `pnpm-lock.yaml` don't match the version specifications in `package.json` files. This typically happens when:

1. Dependencies are updated manually in `package.json` without running `pnpm install`
2. Lockfile becomes corrupted or out of sync
3. Workspace dependencies have conflicting versions
4. Git merge conflicts in lockfile are resolved incorrectly

## Root Cause Analysis

The error message typically shows:
```
specifiers in the lockfile ({"package":"^1.0.0"}) don't match specs in package.json ({"package":"^2.0.0"})
```

This indicates that:
- The lockfile expects one version range
- The package.json specifies a different version range
- PNPM cannot proceed with `--frozen-lockfile` because of this mismatch

## TDD-Based Solution

### 1. Test-Driven Detection

We created comprehensive tests to detect and validate specifier mismatches:

- `src/test/pnpm-specifier-mismatch.test.ts` - Detects specific mismatches
- Validates all workspace dependencies
- Checks for version conflicts between workspaces
- Ensures semver compliance

### 2. Automated Fix Script

- `scripts/fix-specifier-mismatch.sh` - Comprehensive fix script
- `scripts/validate-lockfile-sync.sh` - Quick validation script

### 3. CI Integration

The fix is integrated into the CI workflow to prevent future issues.

## Manual Fix Steps

### Quick Fix
```bash
# 1. Remove lockfile and reinstall
rm pnpm-lock.yaml
pnpm install

# 2. Verify fix
pnpm install --frozen-lockfile
```

### Comprehensive Fix
```bash
# Run the automated fix script
./scripts/fix-specifier-mismatch.sh
```

### Validation
```bash
# Run validation script
./scripts/validate-lockfile-sync.sh

# Or run tests directly
npx vitest src/test/pnpm-specifier-mismatch.test.ts --run
```

## Prevention

### 1. Always use pnpm commands
```bash
# ✅ Correct
pnpm add package@version
pnpm update package

# ❌ Avoid
# Manually editing package.json without running pnpm install
```

### 2. Commit lockfile changes
```bash
# Always commit pnpm-lock.yaml with package.json changes
git add package.json pnpm-lock.yaml
git commit -m "update: package dependencies"
```

### 3. Use workspace protocols
```json
{
  "dependencies": {
    "@workspace/package": "workspace:*"
  }
}
```

### 4. Regular validation
```bash
# Add to package.json scripts
{
  "scripts": {
    "validate:lockfile": "./scripts/validate-lockfile-sync.sh"
  }
}
```

## Troubleshooting

### Common Issues

1. **Workspace version conflicts**
   - Check for same dependency with different versions
   - Use `pnpm list --depth=0` to identify conflicts

2. **Corrupted lockfile**
   - Delete `pnpm-lock.yaml` and reinstall
   - Check for merge conflicts

3. **Node version mismatch**
   - Ensure same Node.js version in CI and local
   - Use `.nvmrc` file

4. **PNPM version mismatch**
   - Use `packageManager` field in package.json
   - Ensure CI uses same PNPM version

### Debug Commands

```bash
# Check dependency tree
pnpm list --depth=0

# Check for outdated packages
pnpm outdated

# Verify lockfile integrity
pnpm install --frozen-lockfile --dry-run

# Check workspace info
pnpm -r list --depth=0
```

## Files Modified

- `src/test/pnpm-specifier-mismatch.test.ts` - TDD test suite
- `scripts/fix-specifier-mismatch.sh` - Automated fix script
- `scripts/validate-lockfile-sync.sh` - Validation script
- `docs/SPECIFIER_MISMATCH_FIX.md` - This documentation

## Validation

Run the following to ensure the fix is working:

```bash
# 1. Run TDD tests
npx vitest src/test/pnpm-specifier-mismatch.test.ts --run

# 2. Validate lockfile
./scripts/validate-lockfile-sync.sh

# 3. Test CI scenario
pnpm install --frozen-lockfile
```
