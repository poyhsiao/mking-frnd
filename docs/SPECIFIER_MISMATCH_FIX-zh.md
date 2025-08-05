# PNPM 规范不匹配修复

## 问题描述

当 `pnpm-lock.yaml` 中的规范与 `package.json` 文件中的版本规范不匹配时，会出现 `ERR_PNPM_OUTDATED_LOCKFILE` 错误。这通常发生在以下情况：

1. 在 `package.json` 中手动更新依赖项而未运行 `pnpm install`
2. 锁文件损坏或不同步
3. 工作区依赖项版本冲突
4. Git 合并冲突中锁文件解决不正确

## 根本原因分析

错误消息通常显示：
```
specifiers in the lockfile ({"package":"^1.0.0"}) don't match specs in package.json ({"package":"^2.0.0"})
```

这表明：
- 锁文件期望一个版本范围
- package.json 指定了不同的版本范围
- 由于此不匹配，PNPM 无法使用 `--frozen-lockfile` 继续

## 基于 TDD 的解决方案

### 1. 测试驱动检测

我们创建了全面的测试来检测和验证规范不匹配：

- `src/test/pnpm-specifier-mismatch.test.ts` - 检测特定不匹配
- 验证所有工作区依赖项
- 检查工作区之间的版本冲突
- 确保 semver 合规性

### 2. 自动修复脚本

- `scripts/fix-specifier-mismatch.sh` - 综合修复脚本
- `scripts/validate-lockfile-sync.sh` - 快速验证脚本

### 3. CI 集成

修复已集成到 CI 工作流程中以防止未来问题。

## 手动修复步骤

### 快速修复
```bash
# 1. 删除锁文件并重新安装
rm pnpm-lock.yaml
pnpm install
```

### 高级修复
```bash
# 1. 备份当前锁文件
cp pnpm-lock.yaml pnpm-lock.yaml.backup

# 2. 清理并重新安装
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# 3. 验证修复
pnpm install --frozen-lockfile
```

## 预防措施

1. **始终使用 PNPM 命令**：使用 `pnpm add/remove/update` 而不是手动编辑 package.json
2. **定期验证**：运行 `./scripts/validate-lockfile-sync.sh`
3. **CI 检查**：确保 CI 使用 `--frozen-lockfile`
4. **工作区管理**：使用 `pnpm -w` 进行工作区级别的操作

## 故障排除

### 常见问题

1. **特定包不匹配**
   ```bash
   # 重新安装特定包
   pnpm remove package-name
   pnpm add package-name@version
   ```

2. **工作区冲突**
   ```bash
   # 检查工作区依赖
   pnpm list --depth=0
   pnpm why package-name
   ```

3. **锁文件损坏**
   ```bash
   # 完全重建
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

## 验证

运行以下命令验证修复：

```bash
# 运行 TDD 测试
npx vitest src/test/pnpm-specifier-mismatch.test.ts --run

# 验证冻结锁文件
pnpm install --frozen-lockfile

# 使用验证脚本
./scripts/validate-lockfile-sync.sh
```

## 修改的文件

- `src/test/pnpm-specifier-mismatch.test.ts` - TDD 测试套件
- `scripts/fix-specifier-mismatch.sh` - 自动修复脚本
- `scripts/validate-lockfile-sync.sh` - 验证脚本
- `docs/SPECIFIER_MISMATCH_FIX.md` - 英文文档
- `docs/SPECIFIER_MISMATCH_FIX-zh.md` - 中文文档

## 后续步骤

1. 在本地审查更改并测试
2. 运行：`git add . && git commit -m 'fix: resolve PNPM specifier mismatch with TDD approach'`
3. 推送更改并监控 CI 构建
4. 使用 `./scripts/validate-lockfile-sync.sh` 进行未来验证

## 技术细节

### TDD 方法

1. **红色**：编写失败的测试来检测问题
2. **绿色**：实施修复使测试通过
3. **重构**：改进解决方案并添加预防措施

### 测试覆盖

- 依赖项规范验证
- 锁文件同步检查
- 版本冲突检测
- Semver 合规性验证
- 冻结锁文件测试

这种基于 TDD 的方法确保了可靠且可维护的解决方案，用于处理 PNPM 规范不匹配问题。