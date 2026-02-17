-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  "apiKey" TEXT UNIQUE,
  password TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Create contents table
CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "coverImage" TEXT,
  category TEXT,
  tags TEXT,
  "authorId" TEXT NOT NULL,
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "publishedAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS contents_status_idx ON contents(status);
CREATE INDEX IF NOT EXISTS contents_category_idx ON contents(category);
CREATE INDEX IF NOT EXISTS contents_author_id_idx ON contents("authorId");

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "authorId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_status_idx ON comments(status);
CREATE INDEX IF NOT EXISTS comments_content_id_idx ON comments("contentId");

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS likes_user_id_content_id_unique ON likes("userId", "contentId");

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  details TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_target_type_target_id_idx ON audit_logs("targetType", "targetId");

-- Create audit_rules table
CREATE TABLE IF NOT EXISTS audit_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
