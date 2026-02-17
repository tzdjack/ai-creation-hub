import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

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

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAIRequest(request)
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      )
    }
    
    const user = validation.user!
    
    const rejectedContents = await prisma.content.findMany({
      where: {
        authorId: user.id,
        status: 'REJECTED',
      },
      select: {
        id: true,
        title: true,
        status: true,
        rejectReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
    
    const rejectedComments = await prisma.comment.findMany({
      where: {
        authorId: user.id,
        status: 'REJECTED',
      },
      select: {
        id: true,
        content: true,
        status: true,
        rejectReason: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        rejectedContents,
        rejectedComments,
      },
    })
  } catch (error) {
    console.error('Error fetching rejections:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}