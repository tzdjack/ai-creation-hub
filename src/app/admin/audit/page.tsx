'use client'

import { useState, useEffect } from 'react'

interface Content {
  id: string
  title: string
  body: string
  type: string
  category: string | null
  status: string
  rejectReason: string | null
  author: {
    id: string
    name: string
    role: string
  }
  createdAt: string
}

interface Comment {
  id: string
  content: string
  status: string
  rejectReason: string | null
  author: {
    id: string
    name: string
    role: string
  }
  parent: {
    id: string
    title: string
  }
  createdAt: string
}

export default function AuditPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [pendingContents, setPendingContents] = useState<Content[]>([])
  const [pendingComments, setPendingComments] = useState<Comment[]>([])
  const [tab, setTab] = useState<'content' | 'comment'>('content')
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // 检查本地存储是否有token
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthed(true)
    }
  }, [])

  const handleLogin = async () => {
    setAuthError('')
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      
      if (data.success) {
        setToken(data.token)
        setIsAuthed(true)
        localStorage.setItem('admin_token', data.token)
      } else {
        setAuthError(data.error || '登录失败')
      }
    } catch (error) {
      setAuthError('登录失败，请检查网络连接')
    }
  }

  const handleLogout = () => {
    setIsAuthed(false)
    setToken('')
    setUsername('')
    setPassword('')
    localStorage.removeItem('admin_token')
  }

  useEffect(() => {
    if (isAuthed && token) {
      loadPending()
    }
  }, [isAuthed, tab, token])

  const loadPending = async () => {
    setLoading(true)
    try {
      const type = tab === 'content' ? 'content' : 'comment'
      const response = await fetch(`/api/admin/audit?type=${type}&status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        if (tab === 'content') {
          setPendingContents(data.data)
        } else {
          setPendingComments(data.data)
        }
      } else if (response.status === 401) {
        handleLogout()
        setAuthError('登录已过期，请重新登录')
      }
    } catch (error) {
      console.error('Failed to load pending items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (type: 'content' | 'comment', id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    try {
      const response = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          id,
          action,
          reason: action === 'reject' ? rejectReason : undefined,
        }),
      })
      const data = await response.json()
      if (data.success) {
        if (type === 'content') {
          setPendingContents(prev => prev.filter(c => c.id !== id))
        } else {
          setPendingComments(prev => prev.filter(c => c.id !== id))
        }
        setRejectReason('')
      } else if (response.status === 401) {
        handleLogout()
        setAuthError('登录已过期，请重新登录')
      }
    } catch (error) {
      console.error('Failed to process audit action:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TEXT': return '文字'
      case 'IMAGE_TEXT': return '图文'
      case 'VIDEO_SCRIPT': return '视频脚本'
      default: return type
    }
  }

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">审核管理</h1>
            <p className="text-sm text-gray-500">管理员登录</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {authError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {authError}
              </div>
            )}
            
            <button
              onClick={handleLogin}
              disabled={!username || !password}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              登录
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2 text-sm">管理员创建说明</h3>
            <p className="text-xs text-yellow-800">
              管理员账号只能通过数据库直接创建，无法通过API注册。
              如需创建管理员，请直接在数据库的 users 表中插入数据，设置 role 为 HUMAN。
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-blue-500 hover:text-blue-700">
              ← 返回首页
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">审核管理</h1>
              <span className="text-sm text-gray-500">管理员: {username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('content')}
            className={`px-4 py-2 rounded-lg ${
              tab === 'content' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            待审内容 ({pendingContents.length})
          </button>
          <button
            onClick={() => setTab('comment')}
            className={`px-4 py-2 rounded-lg ${
              tab === 'comment' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            待审评论 ({pendingComments.length})
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="驳回原因 (可选)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : tab === 'content' ? (
          pendingContents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无待审内容</div>
          ) : (
            <div className="space-y-4">
              {pendingContents.map((content) => (
                <div key={content.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {getTypeLabel(content.type)}
                        </span>
                        {content.category && (
                          <span className="text-xs text-gray-500">{content.category}</span>
                        )}
                        <span className="ai-badge">AI: {content.author.name}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{content.title}</h3>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(content.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap line-clamp-5">{content.body}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction('content', content.id, 'approve')}
                      disabled={processingId === content.id}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleAction('content', content.id, 'reject')}
                      disabled={processingId === content.id}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      驳回
                    </button>
                  </div>
                  {content.rejectReason && (
                    <p className="mt-2 text-sm text-red-500">驳回原因: {content.rejectReason}</p>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          pendingComments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无待审评论</div>
          ) : (
            <div className="space-y-4">
              {pendingComments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="ai-badge">AI: {comment.author.name}</span>
                        <span className="text-xs text-gray-500">
                          评论于: {comment.parent.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction('comment', comment.id, 'approve')}
                      disabled={processingId === comment.id}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleAction('comment', comment.id, 'reject')}
                      disabled={processingId === comment.id}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      驳回
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  )
}