# Coze 平台环境变量配置指南

## 📌 重要说明

**环境变量只需要配置一次**，后续部署会自动使用已保存的配置，不需要每次都重新填写！

## 🔍 Coze 平台环境变量机制

你的代码已经集成了 Coze 平台的环境变量自动加载功能：

- 通过 `src/lib/coze-env.ts` 自动从 Coze 平台加载环境变量
- 使用 `coze_workload_identity` 客户端读取项目配置
- 无需在代码中硬编码任何敏感信息

## ⚙️ 如何在 Coze 平台配置环境变量（一次性配置）

### 方法 1：通过 Coze 管理控制台

1. **登录 Coze 平台**
   - 进入你的项目工作区

2. **找到项目设置**
   - 在项目页面中找到「设置」或「配置」选项
   - 位置通常在：项目 → 设置 → 环境变量

3. **添加环境变量**
   
   点击「添加环境变量」或「Add Variable」，逐个添加以下变量：

   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `DATABASE_URL` | `postgresql://postgres:61R18MXPRrhRV15ZbT@cp-fancy-tract-17036e27.pg4.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require` | 数据库连接字符串 |
   | `NEXTAUTH_SECRET` | `your-secret-key-change-in-production` | 认证密钥（建议修改为随机字符串） |
   | `NEXTAUTH_URL` | `https://your-production-domain.com` | 生产域名 |
   | `ADMIN_API_KEY` | `admin-secret-key-change-in-production` | 管理员 API 密钥 |
   | `INIT_SECRET` | `init-secret-key-change-in-production` | 初始化密钥 |

4. **保存配置**
   - 点击「保存」或「Apply」按钮
   - 配置会持久化存储在 Coze 平台上

5. **重新部署应用**
   - 配置保存后，部署会自动使用这些环境变量
   - 后续所有部署都会自动读取这些配置，无需重复填写

### 方法 2：通过 Coze CLI（如果有）

如果你有 Coze CLI 访问权限，可以使用命令一次性配置所有环境变量：

```bash
# 设置数据库连接
coze env set DATABASE_URL "postgresql://postgres:61R18MXPRrhRV15ZbT@cp-fancy-tract-17036e27.pg4.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require"

# 设置认证密钥
coze env set NEXTAUTH_SECRET "your-secret-key-change-in-production"

# 设置生产域名
coze env set NEXTAUTH_URL "https://your-production-domain.com"

# 设置管理员密钥
coze env set ADMIN_API_KEY "admin-secret-key-change-in-production"

# 设置初始化密钥
coze env set INIT_SECRET "init-secret-key-change-in-production"
```

### 方法 3：通过配置文件（如果支持）

某些 Coze 项目可能支持通过配置文件批量设置环境变量。在你的项目根目录创建 `.coze-env` 文件：

```env
DATABASE_URL=postgresql://postgres:61R18MXPRrhRV15ZbT@cp-fancy-tract-17036e27.pg4.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require
NEXTAUTH_SECRET=your-secret-key-change-in-production
NEXTAUTH_URL=https://your-production-domain.com
ADMIN_API_KEY=admin-secret-key-change-in-production
INIT_SECRET=init-secret-key-change-in-production
```

然后提交此文件到 Coze 平台（具体方法请参考 Coze 文档）。

## ✅ 验证配置

配置完成后，访问健康检查接口确认环境变量已加载：

```
https://your-production-domain.com/api/health
```

**期望的返回结果：**

```json
{
  "status": "ok",
  "platform": {
    "isCoze": true,
    "cozeWorkspacePath": "/workspace/projects/..."
  },
  "environment": {
    "hasCozeEnvVars": true,
    "cozeEnvVarsKeys": [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "ADMIN_API_KEY",
      "INIT_SECRET"
    ]
  },
  "database": {
    "connected": true,
    "userCount": 0
  },
  "hasAdmin": false
}
```

如果看到 `"hasCozeEnvVars": true`，说明环境变量已成功加载！

## 🚀 配置后的工作流

### 第一次配置（一次性）

1. 在 Coze 平台配置环境变量（如上所述）
2. 保存配置
3. 重新部署应用

### 后续所有部署（自动）

✅ **无需任何额外操作！**  
✅ 环境变量会自动加载  
✅ 每次部署都会使用相同的配置  

### 修改环境变量

如果需要修改环境变量：

1. 在 Coze 平台的环境变量配置页面修改对应值
2. 保存配置
3. 重新部署应用
4. 新值会自动生效

## 🔒 安全建议

1. **不要在代码中硬编码敏感信息**
   - ✅ 使用 Coze 平台的环境变量功能
   - ❌ 不要将数据库密码等敏感信息提交到 Git

2. **修改默认密钥**
   - `NEXTAUTH_SECRET`、`ADMIN_API_KEY`、`INIT_SECRET` 使用默认值存在安全风险
   - 建议修改为随机生成的强密钥

3. **限制访问权限**
   - 确保只有授权人员可以访问 Coze 平台的环境变量配置
   - 定期轮换敏感密钥

## ❓ 常见问题

### Q: 为什么每次部署都要填写环境变量？

A: 这通常是因为：
1. 你还没有在 Coze 平台上保存环境变量配置
2. 或者你使用的是手动部署流程，而非 Coze 平台的自动部署

**解决方案**：按照上述方法在 Coze 平台上配置一次，后续会自动使用。

### Q: 如何确认环境变量已保存？

A:
1. 访问 Coze 平台的环境变量配置页面，确认所有变量都显示在列表中
2. 部署后访问 `/api/health` 接口，查看 `hasCozeEnvVars` 是否为 `true`

### Q: 环境变量可以加密存储吗？

A: Coze 平台通常会自动加密存储敏感环境变量。具体请参考 Coze 平台的安全文档。

### Q: 如何在不同的环境（开发/测试/生产）中使用不同的配置？

A: 可以：
1. 为不同环境创建不同的 Coze 项目
2. 或在环境变量名中加入环境前缀（如 `DEV_DATABASE_URL`, `PROD_DATABASE_URL`）
3. 在代码中根据 `NODE_ENV` 读取不同的变量

## 📝 快速配置清单

- [ ] 登录 Coze 平台
- [ ] 找到环境变量配置页面
- [ ] 添加 `DATABASE_URL`
- [ ] 添加 `NEXTAUTH_SECRET`
- [ ] 添加 `NEXTAUTH_URL`
- [ ] 添加 `ADMIN_API_KEY`
- [ ] 添加 `INIT_SECRET`
- [ ] 保存配置
- [ ] 重新部署应用
- [ ] 访问 `/api/health` 确认配置成功
- [ ] 如果 `hasAdmin` 为 false，访问 `/api/init` 初始化数据库

## 🎉 总结

**好消息**：你只需要配置一次环境变量！  

Coze 平台会持久化存储这些配置，后续所有部署都会自动使用，无需重复操作。如果你发现每次部署都要重新填写，那说明还没有正确地在 Coze 平台上保存配置。

配置一次，永久生效！ 🚀
