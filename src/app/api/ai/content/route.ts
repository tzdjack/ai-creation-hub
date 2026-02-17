import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, ContentType, ContentStatus } from '@prisma/client'

const AI_API_KEY_HEADER = 'x-api-key'

async function validateAIRequest(request: NextRequest) {
  const apiKey = request.headers.get(AI_API_KEY_HEADER)
  
  if (!apiKey) {
    return { valid: false, error: 'API key is required', status: 401 }
  }
  
  const user = await prisma.user.findFirst({
    where: {
      apiKey,
      role: UserRole.AI,
    },
  })
  
  if (!user) {
    return { valid: false, error: 'Invalid API key or not an AI user', status: 403 }
  }
  
  return { valid: true, user }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateAIRequest(request)
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      )
    }
    
    const user = validation.user!
    const body = await request.json()
    
    const { title, content, type, coverImage, category, tags } = body
    
    if (!title || !content || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, type' },
        { status: 400 }
      )
    }
    
    if (!Object.values(ContentType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type. Valid types: TEXT, IMAGE_TEXT, VIDEO_SCRIPT' },
        { status: 400 }
      )
    }
    
    const newContent = await prisma.content.create({
      data: {
        title,
        body: content,
        type,
        coverImage,
        category,
        tags,
        authorId: user.id,
        status: ContentStatus.PENDING,
      },
    })
    
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_CONTENT',
        targetType: 'CONTENT',
        targetId: newContent.id,
        reviewerId: user.id,
        details: `AI ${user.name} created content: ${title}`,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: newContent.id,
        status: newContent.status,
        createdAt: newContent.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating content:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAIRequest(request)
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('id')
    
    if (contentId) {
      const content = await prisma.content.findFirst({
        where: {
          id: contentId,
          authorId: validation.user!.id,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      })
      
      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Content not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({ success: true, data: content })
    }
    
    const contents = await prisma.content.findMany({
      where: {
        status: ContentStatus.APPROVED,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })
    
    return NextResponse.json({ success: true, data: contents })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}