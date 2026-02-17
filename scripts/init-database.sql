-- AI创作平台 - 数据库初始化脚本
-- 适用于 PostgreSQL 14+
-- 执行前请确保已连接到目标数据库

-- ============================================
-- 1. 创建枚举类型
-- ============================================

-- 用户角色枚举
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE "userrole" AS ENUM ('AI', 'HUMAN');
    END IF;
END$$;

-- 内容类型枚举
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contenttype') THEN
        CREATE TYPE "contenttype" AS ENUM ('TEXT', 'IMAGE_TEXT', 'VIDEO_SCRIPT');
    END IF;
END$$;

-- 内容状态枚举
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contentstatus') THEN
        CREATE TYPE "contentstatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
END$$;

-- ============================================
-- 2. 创建用户表 (users)
-- ============================================

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "userrole" NOT NULL,
    "apiKey" TEXT UNIQUE,
    "password" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS "users_apiKey_idx" ON "users"("apiKey");

-- ============================================
-- 3. 创建内容表 (contents)
-- ============================================

CREATE TABLE IF NOT EXISTS "contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "contenttype" NOT NULL,
    "status" "contentstatus" NOT NULL DEFAULT 'PENDING',
    "coverImage" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "authorId" TEXT NOT NULL,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- 内容表索引
CREATE INDEX IF NOT EXISTS "contents_status_idx" ON "contents"("status");
CREATE INDEX IF NOT EXISTS "contents_category_idx" ON "contents"("category");
CREATE INDEX IF NOT EXISTS "contents_authorId_idx" ON "contents"("authorId");

-- 外键约束
ALTER TABLE "contents" 
DROP CONSTRAINT IF EXISTS "contents_authorId_fkey";
ALTER TABLE "contents" 
ADD CONSTRAINT "contents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- 4. 创建评论表 (comments)
-- ============================================

CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "contentstatus" NOT NULL DEFAULT 'PENDING',
    "authorId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- 评论表索引
CREATE INDEX IF NOT EXISTS "comments_status_idx" ON "comments"("status");
CREATE INDEX IF NOT EXISTS "comments_contentId_idx" ON "comments"("contentId");

-- 外键约束
ALTER TABLE "comments" 
DROP CONSTRAINT IF EXISTS "comments_authorId_fkey";
ALTER TABLE "comments" 
ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comments" 
DROP CONSTRAINT IF EXISTS "comments_contentId_fkey";
ALTER TABLE "comments" 
ADD CONSTRAINT "comments_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- 5. 创建点赞表 (likes)
-- ============================================

CREATE TABLE IF NOT EXISTS "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- 唯一约束：用户不能重复点赞
ALTER TABLE "likes" 
DROP CONSTRAINT IF EXISTS "likes_userId_contentId_key";
ALTER TABLE "likes" 
ADD CONSTRAINT "likes_userId_contentId_key" UNIQUE ("userId", "contentId");

-- 外键约束
ALTER TABLE "likes" 
DROP CONSTRAINT IF EXISTS "likes_userId_fkey";
ALTER TABLE "likes" 
ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "likes" 
DROP CONSTRAINT IF EXISTS "likes_contentId_fkey";
ALTER TABLE "likes" 
ADD CONSTRAINT "likes_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- 6. 创建审核日志表 (audit_logs)
-- ============================================

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- 审核日志表索引
CREATE INDEX IF NOT EXISTS "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- 外键约束
ALTER TABLE "audit_logs" 
DROP CONSTRAINT IF EXISTS "audit_logs_reviewerId_fkey";
ALTER TABLE "audit_logs" 
ADD CONSTRAINT "audit_logs_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- 7. 创建审核规则表 (audit_rules)
-- ============================================

CREATE TABLE IF NOT EXISTS "audit_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_rules_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 8. 初始化基础数据
-- ============================================

-- 插入默认审核规则
INSERT INTO "audit_rules" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), '内容长度检查', '检查内容长度是否符合要求', true, NOW(), NOW()),
    (gen_random_uuid(), '敏感词过滤', '过滤敏感词汇和违规内容', true, NOW(), NOW()),
    (gen_random_uuid(), '图片合规检查', '检查图片是否符合规范', true, NOW(), NOW()),
    (gen_random_uuid(), '版权检查', '检查内容是否存在版权问题', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. 创建管理员账号（可选，请修改密码）
-- ============================================

-- 创建管理员账号（默认密码: admin123）
-- 注意：生产环境请务必修改密码！
INSERT INTO "users" ("id", "name", "role", "password", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'admin',
    'HUMAN',
    'admin123',
    NOW(),
    NOW()
)
ON CONFLICT ("name") DO NOTHING;

-- 显示创建的管理员信息
SELECT "id", "name", "role", "createdAt" 
FROM "users" 
WHERE "role" = 'HUMAN'::userrole 
AND "name" = 'admin';

-- ============================================
-- 10. 验证初始化结果
-- ============================================

-- 检查所有表是否创建成功
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'contents', 'comments', 'likes', 'audit_logs', 'audit_rules')
ORDER BY tablename;

-- 检查枚举类型
SELECT typname FROM pg_type WHERE typname IN ('userrole', 'contenttype', 'contentstatus');
