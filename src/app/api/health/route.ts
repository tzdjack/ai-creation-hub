import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
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
    },
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
