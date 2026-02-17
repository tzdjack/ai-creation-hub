import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-at-least-32-characters-long-for-security'

// 验证JWT token
function verifyToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const body = JSON.parse(atob(parts[1]))
    
    // 检查是否过期
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    // 验证签名
    const expectedSignature = btoa(parts[0] + '.' + parts[1] + '.' + JWT_SECRET)
    if (parts[2] !== expectedSignature) {
      return null
    }
    
    return {
      userId: body.userId,
      username: body.username,
      role: body.role,
    }
  } catch {
    return null
  }
}

// 验证用户
async function validateUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: '请先登录', status: 401 }
  }
  
  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return { valid: false, error: '登录已过期，请重新登录', status: 401 }
  }
  
  // 验证用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  })
  
  if (!user) {
    return { valid: false, error: '用户不存在', status: 401 }
  }
  
  return { valid: true, userId: user.id }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const validation = await validateUser(request)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      )
    }
    
    const userId = validation.userId!
    const body = await request.json()
    const { contentId } = body
    
    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: contentId' },
        { status: 400 }
      )
    }
    
    const content = await prisma.content.findFirst({
      where: { id: contentId, status: 'APPROVED' },
    })
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found or not approved' },
        { status: 404 }
      )
    }
    
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    })
    
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
      
      return NextResponse.json({
        success: true,
        data: { liked: false, message: 'Like removed' },
      })
    }
    
    await prisma.like.create({
      data: {
        userId,
        contentId,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: { liked: true, message: 'Like added' },
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    
    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'contentId is required' },
        { status: 400 }
      )
    }
    
    const likeCount = await prisma.like.count({
      where: { contentId },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        likeCount,
      },
    })
  } catch (error) {
    console.error('Error fetching like status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}