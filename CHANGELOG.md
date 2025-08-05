# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- 修復 GitHub Actions Docker 構建失敗問題
  - 修改 `backend/Dockerfile` 和 `frontend/Dockerfile` 使用正確的 pnpm
    monorepo 配置
  - 使用 `corepack enable pnpm` 替代 `npm install -g pnpm`
  - 從根目錄複製 `pnpm-lock.yaml`、`pnpm-workspace.yaml` 和 `package.json`
  - 使用 `pnpm fetch --filter=<package>` 改善 Docker 層緩存
  - 使用 `pnpm install --filter=<package> --frozen-lockfile --offline`
    優化安裝過程
  - 修改 CI/CD 配置使用根目錄作為 Docker 構建上下文

### Added

- 新增 Docker 構建驗證腳本 `scripts/verify-docker-build.sh`
- 新增 Docker monorepo 修復文檔 `docs/docker-monorepo-fix.md`
- 新增 Docker 構建測試 `backend/src/__tests__/docker-build.test.js`

### Changed

- 更新 `.github/workflows/ci.yml` Docker 構建上下文從子目錄改為根目錄
- 優化 Dockerfile 使用 pnpm monorepo 最佳實踐

### Technical Details

- 解決了 `pnpm install --frozen-lockfile` 在 Docker 中失敗的問題
- 實施 TDD 方法來驗證修復效果
- 遵循 pnpm 官方 Docker 最佳實踐指南
