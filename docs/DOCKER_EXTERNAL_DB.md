# 使用外部数据库的配置示例

## 1. 配置环境变量

在项目根目录创建 `.env.production` 文件：

```env
# 外部数据库连接地址（必需）
DATABASE_URL="postgresql://用户名:密码@数据库主机:端口/数据库名?schema=public"

# 其他配置
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_API_KEY="admin-secret-key-change-in-production"
INIT_SECRET="init-secret-change-in-production"
```

## 2. 示例配置

### 本地数据库
```env
DATABASE_URL="postgresql://postgres:password@192.168.1.100:5432/ai_hub"
```

### AWS RDS
```env
DATABASE_URL="postgresql://username:password@your-db.cluster-xxx.us-east-1.rds.amazonaws.com:5432/ai_hub"
```

### 阿里云 RDS
```env
DATABASE_URL="postgresql://username:password@pgm-xxx.pg.rds.aliyuncs.com:5432/ai_hub"
```

## 3. 部署步骤

```bash
cd ai-creation-hub

# 确保 .env.production 文件已配置
# 构建并启动
docker-compose -f docker-compose.external-db.yml up -d --build

# 执行数据库迁移
docker-compose -f docker-compose.external-db.yml exec app npx prisma migrate deploy

# 创建管理员账号（连接到你的数据库执行）
psql $DATABASE_URL -c "
INSERT INTO users (id, name, role, password, \"createdAt\", \"updatedAt\")
VALUES (
  gen_random_uuid(),
  'admin',
  'HUMAN',
  'your-password',
  NOW(),
  NOW()
);"
```

## 4. 常用命令

```bash
# 启动
docker-compose -f docker-compose.external-db.yml up -d

# 停止
docker-compose -f docker-compose.external-db.yml down

# 查看日志
docker-compose -f docker-compose.external-db.yml logs -f app

# 重启
docker-compose -f docker-compose.external-db.yml restart

# 更新部署
docker-compose -f docker-compose.external-db.yml up -d --build
```

## 5. 网络注意事项

- 确保 Docker 容器能访问外部数据库
- 如果是云数据库，需要在安全组中放行 Docker 宿主机的 IP
- 建议使用 SSL 连接生产数据库：`postgresql://user:pass@host/db?sslmode=require`

## 6. 原有配置保留

- `docker-compose.yml` - 包含 PostgreSQL，适合本地开发
- `docker-compose.external-db.yml` - 使用外部数据库，适合生产环境
