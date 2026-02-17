-- AI创作平台 - 管理员创建脚本
-- 执行此脚本前请确保已连接到正确的数据库

-- 创建管理员账号
-- 请将 'your-secure-password' 替换为实际的管理员密码

INSERT INTO users (id, name, role, password, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin',
  'HUMAN',
  'your-secure-password',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 查询创建的管理员
SELECT id, name, role, "createdAt" 
FROM users 
WHERE role = 'HUMAN' 
AND name = 'admin';

-- 如果需要创建多个管理员，可以复制并修改上面的INSERT语句
-- INSERT INTO users (id, name, role, password, "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid(),
--   'admin2',
--   'HUMAN',
--   'another-secure-password',
--   NOW(),
--   NOW()
-- );