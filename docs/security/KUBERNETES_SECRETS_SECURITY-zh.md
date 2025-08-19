# Kubernetes 密钥安全指南

本文档概述了为管理 mking-friend Kubernetes 部署中的密钥而实施的安全修复和最佳实践。

## 已解决的安全问题

### 1. 通用 API 密钥检测

**问题**：原始的 `k8s/secrets.yaml` 文件包含敏感凭据的空字符串值，这触发了安全扫描器标记潜在的 API 密钥暴露。

**解决方案**：
- 将空字符串替换为清晰的占位符值（`REPLACE_WITH_BASE64_ENCODED_VALUE`）
- 添加了全面的安全注释和评论
- 实施了适当的密钥管理模式

### 2. 不安全的密钥存储

**问题**：密钥作为普通模板存储，没有适当的安全指导。

**解决方案**：
- 添加了安全通知和警告
- 为 GitOps 工作流实施了 Sealed Secrets 模式
- 添加了适当的 base64 编码说明
- 包含了轮换策略的安全注释

## 实施的安全修复

### 1. 增强的密钥模板（`k8s/secrets.yaml`）

#### 添加的安全注释：
```yaml
annotations:
  security.kubernetes.io/managed-by: "external-secret-manager"
  security.kubernetes.io/rotation-policy: "30d"
  security.kubernetes.io/classification: "restricted"
```

#### 清晰的占位符值：
- 将空字符串替换为 `REPLACE_WITH_BASE64_ENCODED_VALUE`
- 为加密密钥添加了生成说明
- 为每种密钥类型包含了安全警告

#### 安全注释：
- 添加了 `# pragma: allowlist secret` 以防止误报
- 包含了生成命令（例如，`openssl rand -base64 32`）
- 添加了特定上下文的安全指导

### 2. Sealed Secrets 实施（`k8s/sealed-secrets.example.yaml`）

#### 功能：
- **加密密钥**：使用公钥加密，只能在目标集群中解密
- **GitOps 友好**：可以安全地存储在版本控制中
- **命名空间绑定**：密钥绑定到特定的命名空间和名称
- **自动解密**：Sealed Secrets 控制器自动创建常规 Secret

#### 示例配置：
```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: app-secrets
  namespace: mking-friend
  annotations:
    sealedsecrets.bitnami.com/cluster-wide: "false"
    sealedsecrets.bitnami.com/namespace-wide: "false"
spec:
  encryptedData:
    # 使用以下命令生成：
    # echo -n "your-secret-value" | kubeseal --raw --from-file=/dev/stdin --name=app-secrets --namespace=mking-friend
    DATABASE_PASSWORD: "REPLACE_WITH_SEALED_SECRET_VALUE"
```

### 3. 自动化密钥生成（`scripts/generate-secrets.sh`）

#### 功能：
- **安全密钥生成**：使用 `openssl` 生成加密强度的密钥
- **多种密钥类型**：支持密码、十六进制密钥、JWT 密钥
- **环境特定**：为开发和生产生成不同的密钥
- **Sealed Secrets 集成**：可选的 Sealed Secrets 生成

#### 生成的密钥类型：
```bash
# 数据库密码（32字节，base64编码）
DATABASE_PASSWORD=$(openssl rand -base64 32)

# JWT 密钥（64字节十六进制）
JWT_SECRET=$(openssl rand -hex 64)

# 加密密钥（32字节十六进制）
ENCRYPTION_KEY=$(openssl rand -hex 32)

# 会话密钥（32字节，base64编码）
SESSION_SECRET=$(openssl rand -base64 32)
```

## 密钥类别和要求

### 应用程序密钥
| 密钥类型 | 最小长度 | 编码 | 轮换频率 |
|---------|---------|------|----------|
| 数据库密码 | 32字节 | Base64 | 90天 |
| JWT 密钥 | 64字节 | 十六进制 | 180天 |
| Redis 密码 | 32字节 | Base64 | 90天 |
| MinIO 密码 | 24字节 | Base64 | 90天 |
| Typesense API | 32字节 | 十六进制 | 180天 |

### 加密密钥
| 密钥类型 | 最小长度 | 编码 | 轮换频率 |
|---------|---------|------|----------|
| 加密密钥 | 32字节 | 十六进制 | 365天 |
| 会话密钥 | 32字节 | Base64 | 30天 |
| HMAC 密钥 | 32字节 | 十六进制 | 180天 |

### TLS 证书
| 证书类型 | 密钥长度 | 有效期 | 轮换频率 |
|---------|---------|-------|----------|
| 服务器证书 | 2048位 RSA | 90天 | 60天 |
| 客户端证书 | 2048位 RSA | 365天 | 300天 |
| CA 证书 | 4096位 RSA | 10年 | 5年 |

## 安全最佳实践

### 密钥生成
1. **使用加密安全的随机数生成器**：
   ```bash
   # 推荐：使用 OpenSSL
   openssl rand -base64 32
   
   # 避免：使用弱随机数生成器
   echo $RANDOM | base64  # 不安全
   ```

2. **适当的密钥长度**：
   - 密码：最少 32 字节
   - 加密密钥：最少 32 字节
   - JWT 密钥：最少 64 字节

3. **正确的编码**：
   ```bash
   # Base64 编码（用于密码）
   echo -n "secret" | base64
   
   # 十六进制编码（用于加密密钥）
   openssl rand -hex 32
   ```

### 密钥管理工作流

#### 开发环境
1. **生成本地密钥**：
   ```bash
   ./scripts/generate-secrets.sh
   ```

2. **使用生成的 .env 文件**：
   ```bash
   cp k8s/generated/.env.generated .env
   ```

3. **验证密钥强度**：
   ```bash
   # 检查密钥长度
   echo $DATABASE_PASSWORD | base64 -d | wc -c
   ```

#### 生产环境
1. **使用外部密钥管理**：
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Google Secret Manager

2. **实施 Sealed Secrets**：
   ```bash
   # 安装 Sealed Secrets 控制器
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml
   
   # 创建 sealed secret
   echo -n "my-secret" | kubeseal --raw --from-file=/dev/stdin --name=my-secret --namespace=default
   ```

3. **自动化轮换**：
   ```yaml
   # CronJob 示例用于密钥轮换
   apiVersion: batch/v1
   kind: CronJob
   metadata:
     name: secret-rotation
   spec:
     schedule: "0 2 * * 0"  # 每周日凌晨2点
     jobTemplate:
       spec:
         template:
           spec:
             containers:
             - name: rotate-secrets
               image: secret-rotator:latest
               command: ["/bin/sh", "-c", "rotate-secrets.sh"]
   ```

## 外部密钥管理

### External Secrets Operator
```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: mking-friend
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "mking-friend-role"
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: mking-friend
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: DATABASE_PASSWORD
    remoteRef:
      key: mking-friend/database
      property: password
```

### AWS Secrets Manager 集成
```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: mking-friend
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
      auth:
        secretRef:
          accessKeyID:
            name: aws-credentials
            key: access-key-id
          secretAccessKey:
            name: aws-credentials
            key: secret-access-key
```

## RBAC 和访问控制

### 最小权限原则
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: mking-friend
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
  resourceNames: ["app-secrets", "tls-secrets"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: secret-reader-binding
  namespace: mking-friend
subjects:
- kind: ServiceAccount
  name: app-service-account
  namespace: mking-friend
roleRef:
  kind: Role
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

### 服务账户配置
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: mking-friend
  annotations:
    security.kubernetes.io/purpose: "application-secrets-access"
automountServiceAccountToken: true
```

## 监控和审计

### 密钥访问监控
```yaml
# Prometheus 规则示例
groups:
  - name: secret-security.rules
    rules:
      - alert: UnauthorizedSecretAccess
        expr: increase(apiserver_audit_total{verb="get",objectRef_resource="secrets"}[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "检测到异常的密钥访问模式"
          description: "在过去5分钟内检测到超过10次密钥访问"
      
      - alert: SecretRotationOverdue
        expr: (time() - kube_secret_created) > (90 * 24 * 3600)
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "密钥轮换过期"
          description: "密钥 {{ $labels.secret }} 超过90天未轮换"
```

### 审计日志配置
```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
  namespaces: ["mking-friend"]
```

## 合规性和标准

### 支持的标准
- **SOC 2 Type II**：访问控制和加密
- **ISO 27001**：信息安全管理
- **PCI DSS**：支付卡数据保护
- **GDPR**：数据保护和隐私
- **HIPAA**：医疗信息保护

### 合规性检查清单
- [ ] 所有密钥都使用强随机生成
- [ ] 密钥在传输和静态时都已加密
- [ ] 实施了适当的访问控制（RBAC）
- [ ] 启用了审计日志记录
- [ ] 定期进行密钥轮换
- [ ] 实施了密钥备份和恢复程序
- [ ] 进行了安全培训和意识提升

## 应急程序

### 密钥泄露响应
1. **立即行动**：
   ```bash
   # 撤销泄露的密钥
   kubectl delete secret app-secrets -n mking-friend
   
   # 生成新密钥
   ./scripts/generate-secrets.sh --emergency
   
   # 重新部署应用程序
   kubectl rollout restart deployment/app -n mking-friend
   ```

2. **调查和记录**：
   - 确定泄露范围
   - 记录事件详情
   - 通知相关利益相关者

3. **预防措施**：
   - 审查访问日志
   - 加强监控
   - 更新安全程序

### 灾难恢复
```bash
# 从备份恢复密钥
kubectl apply -f backup/secrets-backup.yaml

# 验证密钥完整性
kubectl get secrets -n mking-friend -o yaml | grep -v "resourceVersion\|uid\|creationTimestamp"

# 测试应用程序连接
kubectl exec -it deployment/app -n mking-friend -- /bin/sh -c "test-connections.sh"
```

## 结论

这些安全修复和最佳实践确保了 mking-friend 应用程序中密钥的安全管理。通过实施多层安全方法，我们实现了：

- **强密钥生成**：使用加密安全的随机数生成器
- **安全存储**：通过 Sealed Secrets 和外部密钥管理器
- **适当的访问控制**：通过 RBAC 和最小权限原则
- **持续监控**：通过审计日志和警报
- **合规性**：符合行业标准和法规

定期审查和更新这些安全措施对于维护强大的安全态势和保护敏感数据至关重要。