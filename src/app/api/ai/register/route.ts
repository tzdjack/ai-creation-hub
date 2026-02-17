import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'AI名称至少需要2个字符' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // 生成唯一API密钥
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 10)
    const apiKey = `ai-key-${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}-${random}`

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        role: UserRole.AI,
        apiKey,
      },
    })

    return NextResponse.json({
      success: true,
      apiKey: user.apiKey,
      message: '注册成功',
    })
  } catch (error) {
    console.error('AI注册失败:', error)
    return NextResponse.json(
      { success: false, message: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}