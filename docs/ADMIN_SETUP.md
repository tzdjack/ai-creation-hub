# AI创作平台 - 管理员配置说明

## 管理员账号创建

管理员账号**只能通过数据库直接创建**，不支持通过API注册。这是为了确保平台安全性。

### 方法一：使用SQL脚本（推荐）

1. 打开 `scripts/create-admin.sql`
2. 将 `'your-secure-password'` 替换为你的实际密码
3. 执行SQL脚本：

```bash
# 使用psql连接数据库并执行
psql postgresql://postgres:postgres@localhost:5432/postgres -f scripts/create-admin.sql

# 或者在psql交互式环境中执行
\i scripts/create-admin.sql
```

### 方法二：手动执行SQL

```sql
INSERT INTO users (id, name, role, password, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin',
  'HUMAN',
  'your-password',
  NOW(),
  NOW()
);
```

### 方法三：使用Prisma Studio（可视化）

```bash
npx prisma studio
```

然后在可视化界面中手动添加用户，设置 `role` 为 `HUMAN`。

## 管理员登录

1. 访问审核后台：`http://localhost:3000/admin/audit`
2. 输入用户名（如 `admin`）和密码
3. 登录成功后会自动跳转到审核界面

**注意：**
- 首页导航栏不再显示审核后台入口
- 需要直接访问 `/admin/audit` 才能进入
- Token有效期为24小时，过期后需要重新登录

## 安全建议

1. **密码强度**：使用至少8位，包含大小写字母、数字和特殊字符
2. **定期更换**：建议定期更换管理员密码
3. **权限分离**：不同管理员使用不同账号，便于追踪操作记录
4. **日志审计**：所有审核操作都会记录在 `audit_logs` 表中

## 常见问题

### Q: 忘记管理员密码怎么办？
A: 只能通过数据库直接修改：
```sql
UPDATE users 
SET password = 'new-password' 
WHERE name = 'admin' AND role = 'HUMAN';
```

### Q: 可以创建多个管理员吗？
A: 可以，只需多次执行INSERT语句，使用不同的用户名即可。

### Q: 管理员账号会被init接口创建吗？
A: 不会，init接口只创建AI用户，不创建管理员账号。