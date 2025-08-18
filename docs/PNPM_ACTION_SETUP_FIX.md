# PNPM Action Setup Fix - ERR_PNPM_META_FETCH_FAIL Resolution

## Overview

This document describes the resolution of the `ERR_PNPM_META_FETCH_FAIL` error that occurred in the GitHub Actions "Dependency vulnerability scan (background) - Setup pnpm" workflow.

## Problem Description

### Error Details
```
Run pnpm/action-setup@v2.4.0 
   with: 
     version: 8.15.1 
     dest: ~/setup-pnpm 
     run_install: null 
     package_json_file: package.json 
     standalone: false 
 Running self-installer... 
    WARN  GET `https://registry.npmjs.org/pnpm`  error (ERR_INVALID_THIS). Will retry in 10 seconds. 2 retries left. 
    WARN  GET `https://registry.npmjs.org/pnpm`  error (ERR_INVALID_THIS). Will retry in 1 minute. 1 retries left. 
    ERR_PNPM_META_FETCH_FAIL  GET `https://registry.npmjs.org/pnpm:`  Value of "this" must be of type URLSearchParams 
 Error: Something went wrong, self-installer exits with code 1 
 Installation Completed!
```

### Affected Workflows
- `.github/workflows/security.yml` - Dependency Vulnerability Scan job
- `.github/workflows/ci.yml` - Lint and Type Check job

## Root Cause Analysis

### Primary Cause
The error was caused by using an outdated version of `pnpm/action-setup@v2.4.0` which is incompatible with newer Node.js versions and has known issues with the npm registry API.

### Technical Details
1. **Outdated Action Version**: `pnpm/action-setup@v2` has stopped working with newer Node.js versions
2. **Registry API Changes**: The npm registry API has evolved, causing compatibility issues with older pnpm action versions
3. **URLSearchParams Error**: The `ERR_INVALID_THIS` error indicates a JavaScript context issue in the older action version

### Contributing Factors
- Node.js version 18 compatibility issues with pnpm action setup v2
- Inconsistent pnpm versions across workflows (8.15.1 vs newer versions)
- Lack of version pinning strategy for GitHub Actions

## Solution Implementation

### 1. Upgrade pnpm/action-setup Version

**Before:**
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2.4.0
  with:
    version: 8.15.1
```

**After:**
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9.15.0
    run_install: false
```

### 2. Update pnpm Version

**Environment Variables Updated:**
```yaml
env:
  NODE_VERSION: '18'
  PNPM_VERSION: '9.15.0'  # Updated from 8.15.1
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
```

### 3. Ensure Consistency Across Workflows

Updated both workflows to use the same versions:
- `security.yml`: Updated pnpm action setup and version
- `ci.yml`: Updated pnpm action setup and environment variable

## Files Modified

### 1. `.github/workflows/security.yml`
- Upgraded `pnpm/action-setup` from `v2.4.0` to `v4`
- Updated pnpm version from `8.15.1` to `9.15.0`
- Added `run_install: false` parameter

### 2. `.github/workflows/ci.yml`
- Upgraded `pnpm/action-setup` from `v2` to `v4`
- Updated `PNPM_VERSION` environment variable from `8.15.1` to `9.15.0`

### 3. BDD Test Implementation
- Created `tests/features/pnpm-action-setup-fix.feature`
- Implemented `tests/step-definitions/pnpm-action-setup-fix.steps.ts`
- Updated `tests/package.json` with required dependencies

## Verification Steps

### 1. Manual Verification
```bash
# Check workflow syntax
yq eval '.jobs."dependency-vulnerability-scan".steps[] | select(.uses | contains("pnpm/action-setup"))' .github/workflows/security.yml

# Verify pnpm version consistency
grep -r "PNPM_VERSION" .github/workflows/
```

### 2. BDD Test Scenarios
The fix includes comprehensive BDD test scenarios covering:
- ✅ Fix ERR_PNPM_META_FETCH_FAIL error by upgrading pnpm action setup
- ✅ Ensure consistent pnpm action setup across all workflows
- ✅ Validate the fix with BDD test scenarios
- ✅ Document the fix and prevention measures
- ✅ Ensure rollback capability if the fix fails
- ✅ Monitor the fix effectiveness

### 3. CI/CD Pipeline Validation
```bash
# Run BDD tests
cd tests
npm run test:bdd

# Validate workflow syntax
gh workflow list
gh workflow run ci.yml
gh workflow run security.yml
```

## Prevention Measures

### 1. Version Management Strategy
- **Pin Action Versions**: Always use specific versions (e.g., `@v4`) rather than floating versions
- **Regular Updates**: Schedule quarterly reviews of GitHub Actions versions
- **Compatibility Testing**: Test action updates in feature branches before merging

### 2. Monitoring and Alerting
- **Workflow Monitoring**: Set up alerts for workflow failures
- **Dependency Scanning**: Regular scans for outdated actions and dependencies
- **Success Rate Tracking**: Monitor CI/CD success rates and investigate drops

### 3. Documentation Standards
- **Change Documentation**: Document all workflow changes with rationale
- **Version Compatibility Matrix**: Maintain compatibility information for major versions
- **Rollback Procedures**: Document rollback steps for each major change

### 4. BDD Testing Integration
- **Automated Testing**: Include BDD tests for critical workflow changes
- **Scenario Coverage**: Ensure test scenarios cover both success and failure cases
- **Continuous Validation**: Run BDD tests as part of the CI/CD pipeline

## Rollback Procedure

If the fix causes unexpected issues:

### 1. Immediate Rollback
```bash
# Revert to previous working versions
git revert <commit-hash>

# Or manually update:
# security.yml: pnpm/action-setup@v2.4.0, version: 8.15.1
# ci.yml: pnpm/action-setup@v2, PNPM_VERSION: '8.15.1'
```

### 2. Alternative Solutions
- Use `actions/setup-node` with pnpm installation via npm
- Pin to a specific working pnpm version
- Use Docker-based pnpm installation

## References

### External Documentation
- [pnpm/action-setup GitHub Repository](https://github.com/pnpm/action-setup)
- [pnpm Official Documentation](https://pnpm.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Related Issues
- [pnpm/action-setup#55](https://github.com/pnpm/action-setup/issues/55) - ERR_PNPM_FETCH_404 error
- [pnpm/action-setup#135](https://github.com/pnpm/action-setup/issues/135) - ERR_PNPM_META_FETCH_FAIL error
- [Stack Overflow: pnpm action setup errors](https://stackoverflow.com/questions/74884763)

### Internal Documentation
- `docs/development/bdd-guidelines.md` - BDD implementation guidelines
- `docs/technical-decisions.md` - ADR-012: PNPM Lockfile CI/CD Error resolution
- `docs/SECURITY_NPM_ERROR_FIX.md` - Previous npm/pnpm related fixes

## Conclusion

The `ERR_PNPM_META_FETCH_FAIL` error has been successfully resolved by upgrading `pnpm/action-setup` from v2.4.0 to v4 and updating the pnpm version from 8.15.1 to 9.15.0. The fix includes comprehensive BDD testing, documentation, and prevention measures to avoid similar issues in the future.

### Key Takeaways
1. **Stay Updated**: Regularly update GitHub Actions to avoid compatibility issues
2. **Test Thoroughly**: Use BDD methodology to ensure comprehensive testing
3. **Document Everything**: Maintain clear documentation for troubleshooting and prevention
4. **Monitor Continuously**: Set up monitoring to catch issues early

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Author**: Development Team  
**Review Status**: ✅ Reviewed and Approved