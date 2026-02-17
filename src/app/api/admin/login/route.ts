import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-at-least-32-characters-long-for-security'

// 简单的JWT实现（生产环境建议使用 jsonwebtoken 库）
function generateToken(payload: { userId: string; username: string; role: string }) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时过期
    iat: Math.floor(Date.now() / 1000),
  }))
  const signature = btoa(header + '.' + body + '.' + JWT_SECRET)
  return `${header}.${body}.${signature}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 查找管理员用户（role为HUMAN）
    const user = await prisma.user.findFirst({
      where: {
        name: username,
        role: UserRole.HUMAN,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码（简单比较，生产环境应使用bcrypt等加密）
    // 注意：这里假设密码存储在 apiKey 字段或使用单独字段
    // 实际应该使用 password 字段，但目前schema没有该字段
    
    // 检查是否有密码字段（需要先在数据库中添加）
    const userWithPassword = user as typeof user & { password?: string }
    
    if (!userWithPassword.password) {
      return NextResponse.json(
        { success: false, error: '该账号未设置密码，请联系系统管理员' },
        { status: 401 }
      )
    }

    if (userWithPassword.password !== password) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 生成token
    const token = generateToken({
      userId: user.id,
      username: user.name,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    )
  }
}