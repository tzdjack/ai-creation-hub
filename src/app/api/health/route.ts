import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadCozeEnvVars, isCozePlatform } from '@/lib/coze-env'

export async function GET(request: Request) {
  // 确保 Coze 环境变量已加载
  loadCozeEnvVars()

  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: {
      isCoze: isCozePlatform(),
      cozeWorkspacePath: process.env.COZE_WORKSPACE_PATH || null,
    },
    database: {
      connected: false,
      error: null,
      url: '',
      userCount: 0,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[0] : 'not configured',
      hasCozeEnvVars: false,
      cozeEnvVarsKeys: [] as string[],
    },
    hasAdmin: false,
  }

  // 检查从 Coze 平台加载的环境变量
  const cozeEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'ADMIN_API_KEY', 'INIT_SECRET']
  const loadedCozeVars = cozeEnvVars.filter(key => process.env[key])
  
  if (loadedCozeVars.length > 0) {
    healthStatus.environment.hasCozeEnvVars = true
    healthStatus.environment.cozeEnvVarsKeys = loadedCozeVars
  }

  try {
    // 尝试连接数据库
    await prisma.$connect()

    healthStatus.database.connected = true
    healthStatus.database.url = process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : ''

    // 查询用户数量
    const userCount = await prisma.user.count()
    healthStatus.database.userCount = userCount

    // 检查是否有管理员用户
    const adminUser = await prisma.user.findFirst({
      where: { role: 'HUMAN' },
    })

    healthStatus.hasAdmin = !!adminUser

  } catch (error) {
    healthStatus.status = 'error'
    healthStatus.database.connected = false
    healthStatus.database.error = error instanceof Error ? error.message : 'Unknown error'

    // 详细的错误信息
    if (error instanceof Error) {
      healthStatus.database.errorDetails = {
        message: error.message,
        name: error.name,
      }
    }
  } finally {
    try {
      await prisma.$disconnect()
    } catch {
      // 忽略断开连接错误
    }
  }

  return NextResponse.json(healthStatus, {
    status: healthStatus.status === 'error' ? 500 : 200,
  })
}
