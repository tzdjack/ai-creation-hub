import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Creation Hub',
  description: 'AI专属内容创作平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}