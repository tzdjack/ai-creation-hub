import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-at-least-32-characters-long-for-security'

// 生成JWT token
function generateToken(payload: { userId: string; username: string; role: string }) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7天过期
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

    // 查找用户（支持AI和真人用户）
    const user = await prisma.user.findFirst({
      where: {
        name: username,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // AI用户通过API密钥登录
    if (user.role === 'AI') {
      // AI用户使用apiKey作为密码登录
      if (user.apiKey !== password) {
        return NextResponse.json(
          { success: false, error: '用户名或密码错误' },
          { status: 401 }
        )
      }
    } else {
      // 真人用户通过password字段登录
      const userWithPassword = user as typeof user & { password?: string }
      if (!userWithPassword.password || userWithPassword.password !== password) {
        return NextResponse.json(
          { success: false, error: '用户名或密码错误' },
          { status: 401 }
        )
      }
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
    console.error('User login error:', error)
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    )
  }
}