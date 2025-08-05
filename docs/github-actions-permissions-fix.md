# GitHub Actions Permissions Fix

## Problem Description

The GitHub Actions CI workflow was failing when attempting to push Docker images to GitHub Container Registry (GHCR) with the following error:

```
ERROR: failed to build: failed to solve: failed to push ghcr.io/poyhsiao/mking-frnd/backend:b0d1660d2d7d2411d14f6cea323eafd439a6bd3b: denied: installation not allowed to Create organization package
```

This error occurs when the GitHub Actions workflow lacks the necessary permissions to write packages to the GitHub Container Registry. <mcreference link="https://stackoverflow.com/questions/76607955/error-denied-installation-not-allowed-to-create-organization-package" index="1">1</mcreference>

## Root Cause Analysis

The issue was caused by missing permissions in the GitHub Actions workflow configuration:

1. **Missing `packages: write` permission**: Required to push Docker images to GHCR <mcreference link="https://stackoverflow.com/questions/76607955/error-denied-installation-not-allowed-to-create-organization-package" index="1">1</mcreference>
2. **Missing `contents: read` permission**: Required for checking out the repository code
3. **Missing `id-token: write` permission**: Required for OIDC token-based authentication

The GitHub Actions workflow was using `GITHUB_TOKEN` for authentication but lacked the explicit permissions declaration that GitHub requires for organization repositories. <mcreference link="https://github.com/actions/runner/issues/1039" index="2">2</mcreference>

## Test-Driven Development (TDD) Approach

Following TDD methodology, we created comprehensive tests before implementing the fix:

### Test Suite: `tests/ci/github-actions-permissions.test.ts`

The test suite validates:
- Build job permissions configuration
- Docker login setup with GITHUB_TOKEN
- Image naming conventions for GHCR
- Registry configuration
- Workflow triggers

### Test Categories:

1. **Build Job Permissions**
   - Validates presence of `permissions` section
   - Checks for `packages: write` permission
   - Verifies `contents: read` permission
   - Ensures `id-token: write` permission

2. **Docker Configuration**
   - Validates GHCR registry usage
   - Checks GITHUB_TOKEN authentication
   - Verifies correct image naming format

3. **Workflow Configuration**
   - Validates environment variables
   - Checks workflow triggers

## Solution Implementation

### Updated CI Configuration

Added the required permissions to the `build` job in `.github/workflows/ci.yml`:

```yaml
build:
  name: Build Docker Images
  runs-on: ubuntu-latest
  needs: test
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
  permissions:
    contents: read      # Required for checkout
    packages: write     # Required for GHCR push
    id-token: write     # Required for OIDC authentication
```

### Key Changes:

1. **Added `permissions` section** to the build job
2. **Set `packages: write`** to allow pushing to GHCR <mcreference link="https://stackoverflow.com/questions/76607955/error-denied-installation-not-allowed-to-create-organization-package" index="1">1</mcreference>
3. **Set `contents: read`** for repository access
4. **Set `id-token: write`** for secure authentication

## Test Results

After implementing the fix, all tests pass successfully:

```
✓ GitHub Actions CI Permissions (11)
  ✓ Build job permissions (5)
    ✓ should have a build job defined
    ✓ should have permissions section in build job
    ✓ should have packages write permission for GHCR push
    ✓ should have contents read permission for checkout
    ✓ should have id-token write permission for OIDC
  ✓ Docker login configuration (1)
  ✓ Image naming convention (1)
  ✓ Registry configuration (2)
  ✓ Workflow triggers (2)

Test Files  1 passed (1)
Tests  11 passed (11)
```

## Running Tests

To run the GitHub Actions permissions tests:

```bash
# Run the specific test suite
npx vitest tests/ci/github-actions-permissions.test.ts

# Run all CI-related tests
npx vitest tests/ci/
```

## Security Considerations

1. **Principle of Least Privilege**: Only granted necessary permissions
2. **Scope Limitation**: Permissions are job-specific, not workflow-wide
3. **Token Security**: Using GitHub-managed `GITHUB_TOKEN` instead of personal access tokens

## Debug Commands

For troubleshooting GitHub Actions permissions issues:

```bash
# Check current workflow permissions
gh api repos/:owner/:repo/actions/permissions

# View workflow run logs
gh run view --log

# Test Docker login locally
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin

# Validate YAML syntax
yamllint .github/workflows/ci.yml
```

## References

- [GitHub Actions Permissions Documentation](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs)
- [GitHub Container Registry Authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Push Action Documentation](https://github.com/docker/build-push-action)

## Related Issues

- Fixed Docker build context issues (see `docker-monorepo-fix.md`)
- Resolved pnpm workspace configuration
- Updated CI/CD pipeline for monorepo structure