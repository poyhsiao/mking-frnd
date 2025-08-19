# GitHub Actions 工作流程安全修复

本文档概述了对 `security.yml` GitHub Actions 工作流程进行的安全改进，以解决常见安全漏洞并遵循最佳实践。

## 已识别和修复的问题

### 1. 缺少工作流程级别权限

**问题**：工作流程未在顶层指定权限，可能向所有作业授予过多权限。

**修复**：添加限制性工作流程级别权限：
```yaml
permissions:
  contents: read
```

### 2. 作业权限过多

**问题**：作业使用默认权限运行，违反了最小权限原则。

**修复**：根据每个作业的需求添加特定权限：
- `secret-scan`: `contents: read`, `security-events: write`
- `dependency-scan`: `contents: read`, `security-events: write`
- `sast-scan`: `actions: read`, `contents: read`, `security-events: write`
- `container-scan`: `contents: read`, `security-events: write`
- `infrastructure-scan`: `contents: read`, `security-events: write`
- `security-report`: `contents: read`, `actions: read`

### 3. 未固定的 Action 版本

**问题**：Actions 使用可变引用如 `@main`、`@master` 或 `@v4`，可能导致供应链攻击。

**修复**：将所有 actions 固定到特定版本：
- `actions/checkout@v4.1.1`
- `actions/setup-node@v4.0.1`
- `actions/cache@v4`
- `gitleaks/gitleaks-action@v2.3.6`
- `trufflesecurity/trufflehog@v3.63.2`
- `snyk/actions/node@0.4.0`
- `github/codeql-action/*@v3.22.12`
- `returntocorp/semgrep-action@v1.55.2`
- `aquasecurity/trivy-action@0.16.1`
- `bridgecrewio/checkov-action@v12.2582.0`
- `8398a7/action-slack@v3.16.2`

### 4. 缺少安全配置

**问题**：某些安全工具未配置适当的严重性阈值。

**修复**：为 Trivy 扫描添加严重性配置：
```yaml
severity: 'CRITICAL,HIGH,MEDIUM'
```

## 实施的安全最佳实践

### 1. 最小权限原则
- 每个作业只具有其功能所需的最小权限
- 工作流程级别权限默认为限制性

### 2. 供应链安全
- 所有 actions 都固定到特定版本
- 不使用可变引用（分支或标签）

### 3. 深度防御
- 使用多种安全扫描工具：
  - **密钥检测**：Gitleaks 和 TruffleHog
  - **依赖扫描**：npm audit 和 Snyk
  - **SAST**：CodeQL 和 Semgrep
  - **容器安全**：Trivy
  - **基础设施安全**：Checkov 和 kube-linter

### 4. 全面覆盖
- 扫描涵盖多种语言（JavaScript、TypeScript）
- 多种框架和技术（Docker、Kubernetes）
- 静态和动态分析

### 5. 适当的错误处理
- 结果上传到 GitHub 安全选项卡
- 失败时发送通知
- 适当的软失败以防止阻塞

## 监控和警报

### 安全事件
- 所有扫描结果使用 SARIF 格式上传到 GitHub 安全选项卡
- CodeQL 集成提供详细的漏洞报告
- Slack 通知提醒团队成员安全失败

### 定期扫描
- UTC 时间凌晨 2 点的每日安全扫描
- 推送和拉取请求的持续监控
- 定期依赖漏洞检查

## 合规性和标准

更新的工作流程符合：
- **OWASP Top 10** 安全风险
- **NIST 网络安全框架**
- **GitHub 安全最佳实践**
- **DevSecOps 原则**

## 后续步骤

1. **定期更新**：监控安全 actions 的新版本并定期更新固定版本
2. **自定义规则**：考虑添加特定于您应用程序的自定义安全规则
3. **集成**：根据需要集成其他安全工具
4. **培训**：确保团队成员了解安全工作流程以及如何响应警报

## 参考资料

- [GitHub Actions 安全加固](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [OWASP DevSecOps 指南](https://owasp.org/www-project-devsecops-guideline/)
- [NIST 网络安全框架](https://www.nist.gov/cyberframework)