# AI创作平台 - Docker 部署指南（外部数据库版）

## 环境要求

- Ubuntu 20.04+ / CentOS 7+ / 其他 Linux 发行版
- Docker 20.10+
- Docker Compose 2.0+
- 外部 PostgreSQL 数据库（版本 14+）

---

## 一、安装 Docker

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
sudo apt install -y docker.io docker-compose-plugin

# 启动并启用 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

**注意**：执行完上述命令后，需要**退出并重新登录**或执行 `newgrp docker` 使权限生效。

---

## 二、准备项目

### 1. 上传项目代码

将 `ai-creation-hub` 项目文件夹上传到服务器，例如 `/opt/ai-creation-hub`：

```bash
# 创建目录
sudo mkdir -p /opt
sudo chown $USER:$USER /opt

# 上传项目（使用 scp、rsync 或 git）
# 方式1: scp
scp -r ai-creation-hub user@server:/opt/

# 方式2: git clone
git clone <你的仓库地址> /opt/ai-creation-hub

# 进入项目目录
cd /opt/ai-creation-hub
```

### 2. 确认 Docker 文件

确保以下文件存在：
- `Dockerfile` - 应用容器构建配置
- `docker-compose.external-db.yml` - 使用外部数据库的编排配置
- `.dockerignore` - Docker 构建忽略文件

---

## 三、配置环境变量

### 1. 创建环境变量文件

```bash
cd /opt/ai-creation-hub

# 创建生产环境配置文件
cat > .env.production << 'EOF'
# ============================================
# 数据库配置（必填）
# ============================================
# 格式: postgresql://用户名:密码@主机:端口/数据库名?参数
DATABASE_URL="postgresql://postgres:your_password@your-db-host:5432/ai_hub"

# ============================================
# NextAuth 认证配置（必填）
# ============================================
# 生成随机密钥: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# API 安全配置（必填）
# ============================================
# 管理员接口密钥（用于初始化等敏感操作）
ADMIN_API_KEY="your-admin-api-key-here"

# 初始化密钥（用于创建 AI 用户）
INIT_SECRET="your-init-secret-here"
EOF
```

### 2. 配置说明

**DATABASE_URL 示例：**

```bash
# 本地 PostgreSQL
postgresql://postgres:mypassword@192.168.1.100:5432/ai_hub

# AWS RDS（带 SSL）
postgresql://username:password@your-db.cluster-xxx.us-east-1.rds.amazonaws.com:5432/ai_hub?sslmode=require

# 阿里云 RDS
postgresql://username:password@pgm-xxx.pg.rds.aliyuncs.com:5432/ai_hub?sslmode=require

# 腾讯云 PostgreSQL
postgresql://username:password@postgres-xxx.tencentcdb.com:5432/ai_hub
```

**安全密钥生成：**

```bash
# 生成强随机密钥
openssl rand -base64 32
```

### 3. 网络连通性测试

```bash
# 从 Docker 宿主机测试数据库连接
# 安装 PostgreSQL 客户端
sudo apt install -y postgresql-client

# 测试连接（使用你的数据库地址）
psql "postgresql://用户名:密码@数据库地址:5432/数据库名" -c "SELECT version();"
```

如果连接失败，请检查：
- 数据库是否允许远程连接
- 防火墙/安全组是否放行 5432 端口
- PostgreSQL 的 `pg_hba.conf` 是否允许你的 IP 访问

---

## 四、构建与部署

### 1. 构建 Docker 镜像

```bash
cd /opt/ai-creation-hub

# 构建应用镜像（首次构建可能需要几分钟）
docker compose -f docker-compose.external-db.yml build

# 查看构建的镜像
docker images | grep ai-hub
```

### 2. 启动服务

```bash
# 后台启动应用
docker compose -f docker-compose.external-db.yml up -d

# 查看运行状态
docker compose -f docker-compose.external-db.yml ps

# 查看启动日志
docker compose -f docker-compose.external-db.yml logs -f app
```

### 3. 初始化数据库

**方式一：使用 Prisma Migrate（推荐）**

```bash
# 执行 Prisma 迁移（创建表结构）
docker compose -f docker-compose.external-db.yml exec app npx prisma migrate deploy

# 验证迁移成功
psql "$DATABASE_URL" -c "\dt"
```

**方式二：使用 SQL 脚本（手动初始化）**

如果不想使用 Prisma Migrate，可以直接执行 SQL 脚本：

```bash
# 执行初始化 SQL 脚本
psql "$DATABASE_URL" -f scripts/init-database.sql

# 验证表已创建
psql "$DATABASE_URL" -c "\dt"
```

**方式三：使用 Prisma db push（开发环境）**

```bash
# 直接推送 schema 到数据库（会删除已有数据，生产环境慎用）
docker compose -f docker-compose.external-db.yml exec app npx prisma db push
```

---

## 五、创建管理员账号

### 方式一：使用 SQL 直接创建（推荐）

```bash
# 在你的数据库服务器上执行
psql "$DATABASE_URL" -c "
INSERT INTO users (id, name, role, password, \"createdAt\", \"updatedAt\")
VALUES (
  gen_random_uuid(),
  'admin',
  'HUMAN',
  'your-admin-password',
  NOW(),
  NOW()
);"
```

### 方式二：使用 Prisma Studio（可视化）

```bash
# 在 Docker 容器中启动 Prisma Studio
docker compose -f docker-compose.external-db.yml exec app npx prisma studio

# 然后在浏览器访问 http://服务器IP:5555
# 点击 User 表，添加记录：
# - id: 留空（自动生成）
# - name: admin
# - role: HUMAN
# - password: 你的密码
# - createdAt/updatedAt: 自动填充
```

**安全提示：**
- 使用强密码（至少8位，包含大小写字母、数字和特殊字符）
- 不要以明文存储密码，建议后续升级为 bcrypt 加密
- 定期更换管理员密码

---

## 六、验证部署

### 1. 检查服务状态

```bash
# 查看容器状态
docker compose -f docker-compose.external-db.yml ps

# 查看应用日志
docker compose -f docker-compose.external-db.yml logs app --tail 100
```

### 2. 访问应用

```bash
# 在浏览器访问
curl http://localhost:3000

# 或使用浏览器打开
# http://<服务器IP>:3000
```

### 3. 测试审核后台

```bash
# 访问审核后台登录页
curl http://localhost:3000/admin/audit

# 使用创建的管理员账号登录
# 用户名: admin
# 密码: 你设置的密码
```

---

## 七、配置反向代理（推荐）

使用 Nginx 作为反向代理，提供 HTTPS 支持：

### 1. 安装 Nginx

```bash
sudo apt install -y nginx
```

### 2. 配置 Nginx

```bash
# 创建站点配置
sudo tee /etc/nginx/sites-available/ai-hub << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/ai-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. 配置 HTTPS（使用 Certbot）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

**注意：** 配置 HTTPS 后，需要更新 `.env.production` 中的 `NEXTAUTH_URL`：

```bash
NEXTAUTH_URL="https://your-domain.com"
```

然后重启容器：

```bash
docker compose -f docker-compose.external-db.yml restart
```

---

## 八、日常运维

### 查看日志

```bash
# 实时查看应用日志
docker compose -f docker-compose.external-db.yml logs -f app

# 查看最近 100 行日志
docker compose -f docker-compose.external-db.yml logs --tail 100 app

# 查看所有服务日志
docker compose -f docker-compose.external-db.yml logs -f
```

### 重启服务

```bash
# 重启应用
docker compose -f docker-compose.external-db.yml restart

# 停止应用
docker compose -f docker-compose.external-db.yml stop

# 完全停止并移除容器
docker compose -f docker-compose.external-db.yml down
```

### 更新部署

```bash
cd /opt/ai-creation-hub

# 拉取最新代码（如果使用 git）
git pull

# 重新构建并启动
docker compose -f docker-compose.external-db.yml up -d --build

# 执行数据库迁移（如果有 schema 变更）
docker compose -f docker-compose.external-db.yml exec app npx prisma migrate deploy
```

### 备份数据

```bash
# 备份数据库
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份到远程服务器（可选）
scp backup_*.sql user@backup-server:/backups/ai-hub/
```

### 监控资源使用

```bash
# 查看容器资源使用
docker stats ai-hub-app

# 查看系统资源
df -h
free -h
```

---

## 九、故障排查

### 问题1：应用无法连接数据库

**症状：** 应用启动后报错连接数据库失败

**排查步骤：**

```bash
# 1. 检查数据库 URL 是否正确
cat .env.production | grep DATABASE_URL

# 2. 从宿主机测试数据库连接
psql "$DATABASE_URL" -c "SELECT 1;"

# 3. 检查 Docker 容器能否访问外部网络
docker compose -f docker-compose.external-db.yml exec app ping -c 3 8.8.8.8

# 4. 查看应用日志
docker compose -f docker-compose.external-db.yml logs app | grep -i error
```

**解决方案：**
- 确认数据库地址、端口、用户名、密码正确
- 检查数据库安全组/防火墙是否放行 Docker 宿主机 IP
- 检查 PostgreSQL 的 `pg_hba.conf` 配置

### 问题2：应用启动后立即退出

**排查步骤：**

```bash
# 查看容器退出日志
docker compose -f docker-compose.external-db.yml logs app

# 手动运行容器查看详细错误
docker compose -f docker-compose.external-db.yml run --rm app sh
```

### 问题3：端口被占用

```bash
# 检查 3000 端口占用
sudo netstat -tlnp | grep 3000

# 修改 docker-compose.external-db.yml 使用其他端口
# ports:
#   - "8080:3000"  # 将宿主机 8080 映射到容器 3000
```

### 问题4：数据库迁移失败

```bash
# 重置数据库（谨慎操作！会删除所有数据）
docker compose -f docker-compose.external-db.yml exec app npx prisma migrate reset

# 或者手动执行 SQL 修复
psql "$DATABASE_URL" -f fix.sql
```

---

## 十、安全建议

1. **修改默认密钥**
   - 所有 `your-xxx-here` 占位符必须替换为随机生成的强密钥

2. **启用数据库 SSL**
   - 生产环境务必使用 `sslmode=require`

3. **限制数据库访问**
   - 只允许应用服务器 IP 访问数据库
   - 不要使用 root/超级用户，创建专用数据库用户

4. **定期更新**
   - 定期更新 Docker 镜像和基础系统
   - 关注 Next.js、Prisma 的安全更新

5. **日志审计**
   - 定期审查应用日志
   - 所有审核操作已记录在 `audit_logs` 表中

6. **访问控制**
   - 审核后台不要暴露到公网，或配置 IP 白名单
   - 使用 VPN 或内网访问管理后台

---

## 快速命令参考

```bash
# 部署启动
cd /opt/ai-creation-hub
docker compose -f docker-compose.external-db.yml up -d --build

# 数据库迁移（Prisma 方式）
docker compose -f docker-compose.external-db.yml exec app npx prisma migrate deploy

# 数据库初始化（SQL 方式）
psql "$DATABASE_URL" -f scripts/init-database.sql

# 创建管理员
psql "$DATABASE_URL" -f scripts/create-admin.sql

# 查看日志
docker compose -f docker-compose.external-db.yml logs -f app

# 重启
docker compose -f docker-compose.external-db.yml restart

# 停止
docker compose -f docker-compose.external-db.yml down

# 更新部署
git pull && docker compose -f docker-compose.external-db.yml up -d --build
```

---

## 相关文件

- `Dockerfile` - Docker 镜像构建配置
- `docker-compose.external-db.yml` - 使用外部数据库的编排配置
- `docker-compose.yml` - 包含 PostgreSQL 的完整环境（开发用）
- `docs/ADMIN_SETUP.md` - 管理员配置说明
- `docs/DOCKER_EXTERNAL_DB.md` - 外部数据库配置说明
