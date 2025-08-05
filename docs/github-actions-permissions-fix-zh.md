# GitHub Actions 权限修复

## 问题描述

GitHub Actions CI 工作流在尝试将 Docker 镜像推送到 GitHub Container Registry (GHCR) 时失败，出现以下错误：

```
ERROR: failed to build: failed to solve: failed to push ghcr.io/poyhsiao/mking-frnd/backend:b0d1660d2d7d2411d14f6cea323eafd439a6bd3b: denied: installation not allowed to Create organization package
```

当 GitHub Actions 工作流缺少向 GitHub Container Registry 写入包的必要权限时，就会出现此错误。<mcreference link="https://stackoverflow.com/questions/76607955/error-denied-installation-not-allowed-to-create-organization-package" index="1">1</mcreference>

## 根本原因分析

问题是由 GitHub Actions 工作流配置中缺少权限引起的：

1. **缺少 `packages: write` 权限**：推送 Docker 镜像到 GHCR 所必需 <mcreference link="https://stackoverflow.com/questions/76607955/error-denied-installation-not-allowed-to-create-organization-package" index="1">1</mcreference>
2. **缺少 `contents: read` 权限**：检出仓库代码所必需
3. **缺少 `id-token: write` 权限**：基于 OIDC 令牌的身份验证所必需

GitHub Actions 工作流使用 `GITHUB_TOKEN` 进行身份验证，但缺少 GitHub 对组织仓库要求的显式权限声明。<mcreference link="https://github.com/actions/runner/issues/1039" index="2">2</mcreference>

## 测试驱动开发 (TDD) 方法

遵循 TDD 方法论，我们在实施修复之前创建了全面的测试：

### 测试套件：`tests/ci/github-actions-permissions.test.ts`

测试套件验证：
- 构建作业权限配置
- 使用 GITHUB_TOKEN 的 Docker 登录设置
- GHCR 的镜像命名约定
- 注册表配置
- 工作流触发器

### 测试类别：

1. **构建作业权限**
   - 验证 `permissions` 部分的存在
   - 检查 `packages: write` 权限
   - 验证 `contents: read` 权限
   - 确保 `id-token: write` 权限

2. **Docker 配置**
   - 验证 GHCR 注册表使用
   - 检查 GITHUB_TOKEN 身份验证
   - 验证正确的镜像命名格式

3. **工作流配置**
   - 验证环境变量
   - 检查工作流触发器

## 解决方案实施

### 更新的 CI 配置

在 `.github/workflows/ci.yml` 中为 `build` 作业添加了所需权限：

```yaml
build:
  name: Build Docker Images
  runs-on: ubuntu-latest
  needs: test
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
  permissions:
    contents: read      # 检出所需
    packages: write     # GHCR 推送所需
    id-token: write     # OIDC 身份验证所需
```

### 关键变更：

1. **添加 `permissions` 部分**到构建作业
2. **设置 `packages: write`**以允许推送到 GHCR <mcreference link="https://stackoverflow.com/questions/76607955/error-denied-installation-not-allowed-to-create-organization-package" index="1">1</mcreference>
3. **设置 `contents: read`**用于仓库访问
4. **设置 `id-token: write`**用于安全身份验证

## 测试结果

实施修复后，所有测试都成功通过：

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

## 运行测试

运行 GitHub Actions 权限测试：

```bash
# 运行特定测试套件
npx vitest tests/ci/github-actions-permissions.test.ts

# 运行所有 CI 相关测试
npx vitest tests/ci/
```

## 安全考虑

1. **最小权限原则**：仅授予必要权限
2. **范围限制**：权限是作业特定的，而非工作流范围的
3. **令牌安全**：使用 GitHub 管理的 `GITHUB_TOKEN` 而非个人访问令牌

## 调试命令

用于排查 GitHub Actions 权限问题：

```bash
# 检查当前工作流权限
gh api repos/:owner/:repo/actions/permissions

# 查看工作流运行日志
gh run view --log

# 本地测试 Docker 登录
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin

# 验证 YAML 语法
yamllint .github/workflows/ci.yml
```

## 参考资料

- [GitHub Actions 权限文档](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs)
- [GitHub Container Registry 身份验证](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Push Action 文档](https://github.com/docker/build-push-action)

## 相关问题

- 修复了 Docker 构建上下文问题（参见 `docker-monorepo-fix.md`）
- 解决了 pnpm 工作空间配置
- 更新了单体仓库结构的 CI/CD 管道