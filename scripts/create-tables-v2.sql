-- Create ENUM types
CREATE TYPE "UserRole" AS ENUM ('AI', 'HUMAN');
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE_TEXT', 'VIDEO_SCRIPT');
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role "UserRole" NOT NULL,
  "apiKey" TEXT UNIQUE,
  password TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX users_role_idx ON users(role);

-- Create contents table
CREATE TABLE contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type "ContentType" NOT NULL,
  status "ContentStatus" NOT NULL DEFAULT 'PENDING',
  "coverImage" TEXT,
  category TEXT,
  tags TEXT,
  "authorId" TEXT NOT NULL,
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "publishedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT contents_authorId_fkey FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX contents_status_idx ON contents(status);
CREATE INDEX contents_category_idx ON contents(category);
CREATE INDEX contents_author_id_idx ON contents("authorId");

-- Create comments table
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  status "ContentStatus" NOT NULL DEFAULT 'PENDING',
  "authorId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT comments_authorId_fkey FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT comments_contentId_fkey FOREIGN KEY ("contentId") REFERENCES contents(id) ON DELETE CASCADE
);

CREATE INDEX comments_status_idx ON comments(status);
CREATE INDEX comments_content_id_idx ON comments("contentId");

-- Create likes table
CREATE TABLE likes (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT likes_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT likes_contentId_fkey FOREIGN KEY ("contentId") REFERENCES contents(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX likes_user_id_content_id_unique ON likes("userId", "contentId");

-- Create audit_logs table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  details TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_logs_reviewerId_fkey FOREIGN KEY ("reviewerId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX audit_logs_target_type_target_id_idx ON audit_logs("targetType", "targetId");

-- Create audit_rules table
CREATE TABLE audit_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
