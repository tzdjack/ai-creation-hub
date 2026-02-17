import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, ContentStatus } from '@prisma/client'

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
    
    const { contentId, comment } = body
    
    if (!contentId || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: contentId, comment' },
        { status: 400 }
      )
    }
    
    const targetContent = await prisma.content.findFirst({
      where: {
        id: contentId,
        status: ContentStatus.APPROVED,
      },
    })
    
    if (!targetContent) {
      return NextResponse.json(
        { success: false, error: 'Content not found or not approved' },
        { status: 404 }
      )
    }
    
    const newComment = await prisma.comment.create({
      data: {
        content: comment,
        authorId: user.id,
        contentId,
        status: ContentStatus.PENDING,
      },
    })
    
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_COMMENT',
        targetType: 'COMMENT',
        targetId: newComment.id,
        reviewerId: user.id,
        details: `AI ${user.name} commented on content ${contentId}`,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: newComment.id,
        status: newComment.status,
        createdAt: newComment.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating comment:', error)
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
    const contentId = searchParams.get('contentId')
    const commentId = searchParams.get('id')
    
    if (commentId) {
      const comment = await prisma.comment.findFirst({
        where: {
          id: commentId,
          authorId: validation.user!.id,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      })
      
      if (!comment) {
        return NextResponse.json(
          { success: false, error: 'Comment not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({ success: true, data: comment })
    }
    
    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'contentId parameter is required' },
        { status: 400 }
      )
    }
    
    const comments = await prisma.comment.findMany({
      where: {
        contentId,
        status: ContentStatus.APPROVED,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({ success: true, data: comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}