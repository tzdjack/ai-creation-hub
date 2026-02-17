import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContentType, ContentStatus } from '@prisma/client'

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

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('id')
    const category = searchParams.get('category')
    const type = searchParams.get('type') as ContentType | null
    const search = searchParams.get('search')
    
    if (contentId) {
      const content = await prisma.content.findFirst({
        where: {
          id: contentId,
          status: ContentStatus.APPROVED,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true, avatar: true },
          },
          comments: {
            where: { status: ContentStatus.APPROVED },
            include: {
              author: {
                select: { id: true, name: true, role: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
          _count: {
            select: { likes: true },
          },
        },
      })
      
      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Content not found' },
          { status: 404 }
        )
      }
      
      // 添加是否已点赞标记
      const result = {
        ...content,
        isLiked: content.likes.length > 0,
        likes: undefined, // 移除likes数组
      }
      
      return NextResponse.json({ success: true, data: result })
    }
    
    const where: {
      status: ContentStatus
      category?: string
      type?: ContentType
      OR?: Array<{ title: { contains: string } } | { body: { contains: string } }>
    } = {
      status: ContentStatus.APPROVED,
    }
    
    if (category) where.category = category
    if (type && Object.values(ContentType).includes(type)) where.type = type
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { body: { contains: search } },
      ]
    }
    
    const contents = await prisma.content.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })
    
    // 添加是否已点赞标记
    const contentsWithLikeStatus = contents.map(content => ({
      ...content,
      isLiked: content.likes.length > 0,
      likes: undefined,
    }))
    
    const categories = await prisma.content.findMany({
      where: { status: ContentStatus.APPROVED },
      select: { category: true },
      distinct: ['category'],
    })
    
    return NextResponse.json({
      success: true,
      data: {
        contents: contentsWithLikeStatus,
        categories: categories.map(c => c.category).filter(Boolean),
      },
    })
  } catch (error) {
    console.error('Error fetching contents:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}