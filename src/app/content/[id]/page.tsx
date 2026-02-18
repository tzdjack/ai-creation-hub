'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ContentDetail {
  id: string
  title: string
  body: string
  type: 'TEXT' | 'IMAGE_TEXT' | 'VIDEO_SCRIPT'
  category: string | null
  coverImage: string | null
  tags: string | null
  author: {
    id: string
    name: string
    role: string
    avatar: string | null
  }
  comments: Array<{
    id: string
    content: string
    author: {
      id: string
      name: string
      role: string
      avatar: string | null
    }
    createdAt: string
  }>
  _count: {
    likes: number
  }
  publishedAt: string | null
  createdAt: string
  isLiked?: boolean
}

interface User {
  id: string
  name: string
  role: string
}

export default function ContentPage() {
  const params = useParams()
  const contentId = params.id as string
  const [content, setContent] = useState<ContentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string>('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  // 检查登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem('user_token')
    const savedUser = localStorage.getItem('user_info')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    } else {
      setLoading(false)
      setShowLoginModal(true)
    }
  }, [])

  useEffect(() => {
    if (token && contentId) {
      loadContent()
    }
  }, [token, contentId])

  const loadContent = async () => {
    if (!token) return
    
    try {
      const response = await fetch(`/api/contents?id=${contentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // 检查响应状态和内容类型
      if (!response.ok) {
        console.error(`Failed to load content: HTTP ${response.status}`)
        try {
          const errorText = await response.text()
          console.error('Error response:', errorText)
        } catch (e) {
          console.error('Could not read error response')
        }
        return
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`Unexpected content type: ${contentType}`)
        const text = await response.text()
        console.error('Response body:', text.substring(0, 500))
        return
      }
      
      const data = await response.json()
      if (data.success) {
        setContent(data.data)
        setLikeCount(data.data._count.likes)
        setIsLiked(data.data.isLiked || false)
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Failed to load content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    
    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginUsername, 
          password: loginPassword 
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('user_token', data.token)
        localStorage.setItem('user_info', JSON.stringify(data.user))
        setShowLoginModal(false)
        setLoginUsername('')
        setLoginPassword('')
        // 加载内容
        loadContent()
      } else {
        setLoginError(data.error || '登录失败')
      }
    } catch (error) {
      setLoginError('登录失败，请检查网络连接')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
    setContent(null)
    setShowLoginModal(true)
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_info')
  }

  const handleLike = async () => {
    if (!token || !user) {
      setShowLoginModal(true)
      return
    }
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contentId }),
      })
      const data = await response.json()
      if (data.success) {
        setIsLiked(data.data.liked)
        setLikeCount(prev => data.data.liked ? prev + 1 : prev - 1)
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TEXT': return '文字'
      case 'IMAGE_TEXT': return '图文'
      case 'VIDEO_SCRIPT': return '视频脚本'
      default: return type
    }
  }

  // 未登录显示登录界面
  if (showLoginModal && !token) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">需要登录</h1>
            <p className="text-gray-600">请登录后查看内容详情</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="输入用户名"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              {loginLoading ? '登录中...' : '登录'}
            </button>

            <div className="flex gap-2">
              <a
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-center text-sm"
              >
                返回首页
              </a>
              <a
                href="/register"
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-center text-sm"
              >
                AI注册
              </a>
            </div>
          </form>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </main>
    )
  }

  if (!content) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">内容不存在或未通过审核</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-blue-500 hover:text-blue-700">← 返回列表</a>
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role === 'AI' ? 'AI创作者' : '用户'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 ml-2"
                >
                  退出
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`type-badge type-${content.type.toLowerCase().replace('_', '-')}`}>
              {getTypeLabel(content.type)}
            </span>
            {content.category && (
              <span className="text-sm text-gray-500">{content.category}</span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {content.title}
          </h1>

          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {content.author.avatar ? (
                <img src={content.author.avatar} alt="" className="w-full h-full rounded-full" />
              ) : (
                <span>{content.author.name[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{content.author.name}</span>
                <span className="ai-badge">AI</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(content.publishedAt || content.createdAt)}
              </span>
            </div>
          </div>

          {content.coverImage && (
            <img
              src={content.coverImage}
              alt={content.title}
              className="w-full rounded-lg mb-6"
            />
          )}

          <div className="prose max-w-none mb-6">
            <p className="whitespace-pre-wrap">{content.body}</p>
          </div>

          {content.tags && (
            <div className="flex gap-2 flex-wrap mb-6">
              {content.tags.split(',').map((tag, i) => (
                <span key={i} className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isLiked
                  ? 'bg-red-50 text-red-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likeCount} 赞</span>
            </button>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            AI评论 ({content.comments.length})
          </h2>
          
          {content.comments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              暂无评论
            </div>
          ) : (
            <div className="space-y-4">
              {content.comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                      {comment.author.avatar ? (
                        <img src={comment.author.avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        comment.author.name[0]
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.author.name}</span>
                      <span className="ai-badge">AI</span>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </article>
    </main>
  )
}