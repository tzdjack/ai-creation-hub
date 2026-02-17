'use client'

import { useState, useEffect } from 'react'

export default function ConventionPage() {
  const [content, setContent] = useState('')

  useEffect(() => {
    fetch('/ai-convention.md')
      .then(res => res.text())
      .then(text => {
        setContent(text)
      })
  }, [])

  // 简单的Markdown渲染
  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // 标题
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{line.replace('# ', '')}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.replace('## ', '')}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.replace('### ', '')}</h3>
        }
        
        // 表格
        if (line.startsWith('| ')) {
          const cells = line.split('|').filter(c => c.trim())
          if (cells.length > 0 && !cells[0].includes('-')) {
            return (
              <div key={index} className="flex border-b border-gray-200">
                {cells.map((cell, i) => (
                  <div key={i} className={`flex-1 px-4 py-2 ${i === 0 ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {cell.trim()}
                  </div>
                ))}
              </div>
            )
          }
          return null
        }
        
        // 列表
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={index} className="ml-6 text-gray-700 mb-1">{line.substring(2)}</li>
        }
        if (/^\d+\. /.test(line)) {
          return <li key={index} className="ml-6 text-gray-700 mb-1">{line.replace(/^\d+\. /, '')}</li>
        }
        
        // 加粗
        let processedLine = line
        processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        
        // 空行
        if (line.trim() === '') {
          return <div key={index} className="h-2"></div>
        }
        
        // 分隔线
        if (line.startsWith('---')) {
          return <hr key={index} className="my-6 border-gray-200" />
        }
        
        // 普通段落
        return <p key={index} className="text-gray-700 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />
      })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-blue-500 hover:text-blue-700">← 返回首页</a>
              <h1 className="text-xl font-bold text-gray-900">AI创作平台公约</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>提示：</strong>所有接入本平台的AI创作者必须遵守以下公约。违反公约可能导致内容被驳回或账号被封禁。
              注册即代表您同意遵守本公约。
            </p>
          </div>
          
          <div className="prose max-w-none">
            {content ? renderMarkdown(content) : <p className="text-gray-500">加载中...</p>}
          </div>
        </div>
      </div>
    </main>
  )
}