import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContentStatus } from '@prisma/client'

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
    
    // 验证签名（简化版）
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

// 验证管理员身份
async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: '未登录', status: 401 }
  }
  
  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return { valid: false, error: '登录已过期，请重新登录', status: 401 }
  }
  
  // 验证用户是否仍然存在且是管理员
  const user = await prisma.user.findFirst({
    where: {
      id: decoded.userId,
      role: 'HUMAN',
    },
  })
  
  if (!user) {
    return { valid: false, error: '用户不存在或权限已变更', status: 401 }
  }
  
  return { valid: true, userId: user.id, username: user.name }
}

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdmin(request)
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'content'
    const status = searchParams.get('status') as ContentStatus | null
    
    if (type === 'content') {
      const where: { status?: ContentStatus } = {}
      if (status && Object.values(ContentStatus).includes(status)) {
        where.status = status
      }
      
      const contents = await prisma.content.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      return NextResponse.json({ success: true, data: contents })
    } else if (type === 'comment') {
      const where: { status?: ContentStatus } = {}
      if (status && Object.values(ContentStatus).includes(status)) {
        where.status = status
      }
      
      const comments = await prisma.comment.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          parent: {
            select: { id: true, title: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      return NextResponse.json({ success: true, data: comments })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "content" or "comment"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching audit queue:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateAdmin(request)
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      )
    }
    
    const body = await request.json()
    const { type, id, action, reason } = body
    
    if (!type || !id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, id, action' },
        { status: 400 }
      )
    }
    
    if (!['content', 'comment'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Use "content" or "comment"' },
        { status: 400 }
      )
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }
    
    const newStatus = action === 'approve' ? ContentStatus.APPROVED : ContentStatus.REJECTED
    
    if (type === 'content') {
      const content = await prisma.content.findUnique({
        where: { id },
      })
      
      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Content not found' },
          { status: 404 }
        )
      }
      
      const updateData: {
        status: ContentStatus
        rejectReason?: string | null
        publishedAt?: Date | null
      } = { status: newStatus }
      
      if (action === 'reject') {
        updateData.rejectReason = reason || 'Not specified'
        updateData.publishedAt = null
      } else {
        updateData.rejectReason = null
        updateData.publishedAt = new Date()
      }
      
      await prisma.content.update({
        where: { id },
        data: updateData,
      })
      
      await prisma.auditLog.create({
        data: {
          action: action.toUpperCase() + '_CONTENT',
          targetType: 'CONTENT',
          targetId: id,
          reviewerId: validation.userId!,
          details: action === 'reject' 
            ? `Rejected: ${reason || 'Not specified'}` 
            : 'Approved',
        },
      })
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id },
      })
      
      if (!comment) {
        return NextResponse.json(
          { success: false, error: 'Comment not found' },
          { status: 404 }
        )
      }
      
      const updateData: {
        status: ContentStatus
        rejectReason?: string | null
      } = { status: newStatus }
      
      if (action === 'reject') {
        updateData.rejectReason = reason || 'Not specified'
      } else {
        updateData.rejectReason = null
      }
      
      await prisma.comment.update({
        where: { id },
        data: updateData,
      })
      
      await prisma.auditLog.create({
        data: {
          action: action.toUpperCase() + '_COMMENT',
          targetType: 'COMMENT',
          targetId: id,
          reviewerId: validation.userId!,
          details: action === 'reject' 
            ? `Rejected: ${reason || 'Not specified'}` 
            : 'Approved',
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id,
        type,
        action,
        newStatus,
      },
    })
  } catch (error) {
    console.error('Error processing audit action:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}