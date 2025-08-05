# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Fixed Docker image cleanup bug in `verify-docker-build.sh` script
  - Script now only removes images it creates (`verify-backend` and `verify-frontend`)
  - Removed incorrect cleanup of `test-backend` and `test-frontend` images that were not created by the script
  - Prevents potential interference with other processes that might be using those image names
  - Implemented TDD methodology with comprehensive test suite to verify correct cleanup behavior

- Improved pnpm version pinning in Dockerfiles using corepack
  - Updated `backend/Dockerfile` to use `corepack prepare pnpm@8.15.0 --activate` for explicit version pinning
  - Updated `frontend/Dockerfile` to use `corepack prepare pnpm@8.15.0 --activate` for explicit version pinning
  - Replaced `npm install -g pnpm@8.15.1` with corepack-based approach for consistency
  - Added proper PNPM_HOME and PATH environment variables in both Dockerfiles
  - Ensured consistent pnpm version across all Docker stages
  - Implemented TDD methodology with comprehensive test suites for both backend and frontend Docker build verification
  - Enhanced `verify-docker-build.sh` script to test both backend and frontend pnpm version pinning

- 修復 GitHub Actions CI 中 backend tests 的路徑解析問題
  - 改進 `docker-build.test.js` 中的項目根目錄檢測邏輯
  - 使用 `pnpm-workspace.yaml` 文件來可靠地定位項目根目錄
  - 添加更好的錯誤處理和文件存在性檢查
  - 確保測試在本地和 CI 環境中都能正常運行
- 修復 GitHub Actions Docker 構建失敗問題
  - 修改 `backend/Dockerfile` 和 `frontend/Dockerfile` 使用正確的 pnpm
    monorepo 配置
  - 使用 `corepack enable pnpm` 替代 `npm install -g pnpm`
  - 從根目錄複製 `pnpm-lock.yaml`、`pnpm-workspace.yaml` 和 `package.json`
  - 使用 `pnpm fetch --filter=<package>` 改善 Docker 層緩存
  - 使用 `pnpm install --filter=<package> --frozen-lockfile --offline`
    優化安裝過程
  - 修改 CI/CD 配置使用根目錄作為 Docker 構建上下文

- Fixed Codecov integration and upload errors in CI/CD pipeline
  - Upgraded Codecov Action from v4 to v5 for improved reliability and performance
  - Enabled `fail_ci_if_error: true` for strict error handling in CI pipeline
  - Added environment variables (`OS`, `NODE_VERSION`) for better coverage context
  - Configured `disable_search: false` to optimize coverage file discovery
  - Implemented comprehensive test coverage validation with TDD methodology
  - Enhanced error reporting and debugging capabilities for coverage uploads
  - Updated documentation with Context7 best practices for Codecov integration

### Added

- 新增 Docker 構建驗證腳本 `scripts/verify-docker-build.sh`
- 新增 Docker monorepo 修復文檔 `docs/docker-monorepo-fix.md`
- 新增 Docker 構建測試 `backend/src/__tests__/docker-build.test.js`
- Added Codecov integration fix documentation (`docs/codecov-fix.md` and `docs/codecov-fix-zh.md`)
- Added comprehensive test suite for Codecov integration (`tests/ci/codecov-integration.test.ts` and `tests/ci/codecov-upload.test.ts`)
- Enhanced CI/CD pipeline with improved Codecov Action v5 configuration

### Changed

- 更新 `.github/workflows/ci.yml` Docker 構建上下文從子目錄改為根目錄
- 優化 Dockerfile 使用 pnpm monorepo 最佳實踐

### Technical Details

- 解決了 `pnpm install --frozen-lockfile` 在 Docker 中失敗的問題
- 實施 TDD 方法來驗證修復效果
- 遵循 pnpm 官方 Docker 最佳實踐指南
