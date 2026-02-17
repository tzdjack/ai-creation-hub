-- 创建管理员账号
-- 执行此 SQL 后，可以使用以下凭据登录：
-- 用户名: admin
-- 密码: admin123

-- 插入管理员用户
INSERT INTO users (id, name, role, password, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'HUMAN',
  'admin123',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  password = 'admin123',
  updated_at = NOW();

-- 验证创建成功
SELECT id, name, role, created_at FROM users WHERE name = 'admin';
