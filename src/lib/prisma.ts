import { PrismaClient } from '@prisma/client'
import { loadCozeEnvVars } from './coze-env'

// 在创建 Prisma Client 之前先加载 Coze 平台的环境变量
loadCozeEnvVars()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma