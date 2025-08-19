# PostgreSQL 健康检查修复

## 问题描述

在 `docker-compose.test.yml` 文件中，PostgreSQL 健康检查命令使用了硬编码的数据库名称，这导致了配置不一致的问题。

### 原始问题

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]
```

硬编码的数据库名称 `postgres` 与实际的测试数据库配置不匹配，当使用不同的数据库名称（如 `mking_test`）时会导致健康检查失败。

## 解决方案

### 修复内容

将硬编码的数据库名称替换为环境变量：

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d ${POSTGRES_TEST_DB}"]
```

这确保了健康检查命令使用与容器配置相同的数据库名称。

### BDD 测试方法

我们采用了行为驱动开发（BDD）方法来验证修复：

1. **功能文件**: `features/postgres-health-check.feature`
   - 定义了PostgreSQL健康检查的预期行为
   - 包含环境变量使用的测试场景

2. **步骤定义**: `features/step_definitions/postgres-health-check.steps.ts`
   - 实现了BDD测试步骤
   - 验证Docker Compose配置

3. **测试配置**: `cucumber.cjs`
   - Cucumber测试运行器配置
   - 支持TypeScript和多种输出格式

## 验证过程

修复通过以下方式验证：

1. **Docker Compose配置验证**:
   ```bash
   POSTGRES_TEST_DB=mking_test \
   POSTGRES_TEST_USER=postgres \
   MINIO_TEST_USER=minioadmin \
   MINIO_TEST_PASSWORD=minioadmin \
   TYPESENSE_TEST_API_KEY=xyz \
   docker compose -f docker-compose.test.yml config
   ```

2. **环境变量替换确认**:
   验证健康检查命令正确使用了 `${POSTGRES_TEST_DB}` 环境变量

## 修复的好处

1. **可配置性**: 数据库名称现在可以通过环境变量配置
2. **一致性**: 健康检查使用与容器相同的数据库配置
3. **可维护性**: 减少了硬编码值，提高了代码可维护性
4. **测试覆盖**: BDD测试确保配置的正确性
5. **文档完整**: 提供了清晰的问题描述和解决方案文档

## 相关文件

- `docker-compose.test.yml`: 主要修复文件
- `features/postgres-health-check.feature`: BDD功能测试
- `features/step_definitions/postgres-health-check.steps.ts`: 测试步骤实现
- `package.json`: 添加了Cucumber依赖和测试脚本
- `cucumber.cjs`: Cucumber配置文件
- `README.md`: 更新了文档引用

这个修复确保了PostgreSQL健康检查在所有测试环境中都能正常工作，无论使用什么数据库名称。