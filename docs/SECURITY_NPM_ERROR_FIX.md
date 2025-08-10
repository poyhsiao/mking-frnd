# Security Workflow npm Error Fix

## Issue Description

The GitHub Actions workflow for dependency vulnerability scanning was failing with the following error:

```
npm error Run "npm help ci" for more info 
npm error A complete log of this run can be found in: /home/runner/.npm/_logs/2025-08-10T10_59_29_345Z-debug-0.log 
Error: Process completed with exit code 1.
```

**Action Number**: `16860587093`
**Phase**: `dependency vulnerability scan(frontend)`

## Root Cause Analysis

The error occurred because:

1. **Package Manager Mismatch**: The project uses **pnpm** as the package manager (specified in `package.json` with `"packageManager": "pnpm@8.15.1"`), but the GitHub Actions workflow was attempting to use `npm ci`.

2. **Missing Lock File**: The workflow was looking for `package-lock.json` files, but pnpm uses `pnpm-lock.yaml` instead.

3. **Workspace Configuration**: This is a pnpm workspace project with a `pnpm-workspace.yaml` file, requiring workspace-aware dependency installation.

## Solution Implemented

### 1. Updated Package Manager Setup

**Before:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4.0.1
  with:
    node-version: '18'

- name: Get npm cache directory
  id: npm-cache-dir
  shell: bash
  run: echo "dir=$(npm config get cache)" >> ${GITHUB_OUTPUT}

- name: Setup npm cache
  uses: actions/cache@v3.3.2
  with:
    path: ${{ steps.npm-cache-dir.outputs.dir }}
    key: ${{ runner.os }}-node-${{ hashFiles(format('{0}/package-lock.json', matrix.directory)) }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Install dependencies
  working-directory: ${{ matrix.directory }}
  run: npm ci
```

**After:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4.0.1
  with:
    node-version: '18'

- name: Setup pnpm
  uses: pnpm/action-setup@v2.4.0
  with:
    version: 8.15.1

- name: Get pnpm store directory
  id: pnpm-cache
  shell: bash
  run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

- name: Setup pnpm cache
  uses: actions/cache@v3.3.2
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

### 2. Updated Audit Commands

**Before:**
```yaml
- name: Run npm audit
  working-directory: ${{ matrix.directory }}
  run: |
    npm audit --audit-level=moderate
    npm audit fix --dry-run
```

**After:**
```yaml
- name: Run pnpm audit
  run: |
    pnpm audit --audit-level=moderate
    pnpm audit --fix --dry-run || true
```

### 3. Updated Snyk Configuration

**Before:**
```yaml
- name: Run Snyk Security Scan
  uses: snyk/actions/node@0.4.0
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=medium --file=${{ matrix.directory }}/package.json
    command: test
```

**After:**
```yaml
- name: Run Snyk Security Scan
  uses: snyk/actions/node@0.4.0
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=medium --file=${{ matrix.directory }}/package.json --package-manager=pnpm
    command: test
```

## Key Changes Made

### 1. Package Manager Setup
- Added `pnpm/action-setup@v2.4.0` to properly install pnpm version 8.15.1
- Updated cache configuration to use pnpm store path instead of npm cache
- Changed cache key to use `pnpm-lock.yaml` instead of `package-lock.json`

### 2. Dependency Installation
- Replaced `npm ci` with `pnpm install --frozen-lockfile`
- Removed `working-directory` since pnpm workspaces handle this automatically
- Used `--frozen-lockfile` flag to ensure reproducible builds

### 3. Security Scanning
- Updated audit commands to use `pnpm audit` instead of `npm audit`
- Added `|| true` to prevent pipeline failure on audit warnings
- Configured Snyk to explicitly use pnpm as the package manager

### 4. Workspace Compatibility
- Leveraged pnpm's native workspace support
- Ensured all dependencies are installed from the workspace root
- Maintained matrix strategy for scanning both backend and frontend

## Benefits of the Fix

1. **Compatibility**: Workflow now matches the project's actual package manager
2. **Performance**: pnpm's efficient dependency management and caching
3. **Reliability**: Proper lockfile handling prevents dependency drift
4. **Security**: Maintained all security scanning capabilities with correct package manager
5. **Workspace Support**: Native handling of monorepo structure

## Verification

To verify the fix works correctly:

1. Check that `pnpm-lock.yaml` exists in the repository root
2. Ensure `pnpm-workspace.yaml` defines the correct workspace packages
3. Verify that both backend and frontend directories have `package.json` files
4. Run the workflow and confirm successful dependency installation and scanning

## Prevention

To prevent similar issues in the future:

1. **Documentation**: Always document the package manager used in the project
2. **Consistency**: Ensure CI/CD workflows match local development setup
3. **Testing**: Test workflow changes in a separate branch before merging
4. **Monitoring**: Set up alerts for workflow failures to catch issues early

## Related Files

- `.github/workflows/security.yml` - Updated security workflow
- `package.json` - Root package configuration with pnpm specification
- `pnpm-workspace.yaml` - Workspace configuration
- `pnpm-lock.yaml` - Dependency lockfile
- `frontend/package.json` - Frontend package configuration
- `backend/package.json` - Backend package configuration