import type { Metadata } from 'next'
import '@/styles/globals.css'
import 'katex/dist/katex.min.css'
import { MagicParticles } from '@/components/MagicParticles'

export const metadata: Metadata = {
  title: "Neysa's Blog",
  description: 'A whole new world of programming',
  keywords: ['cuda', 'gpu'],
  icons: {
    icon: [
      { url: '/jasmine.png', sizes: '32x32', type: 'image/png' },
      { url: '/jasmine.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/jasmine.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/jasmine.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Google 字体 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Lavishly+Yours&family=Beth+Ellen&family=Reem+Kufi:wght@400;500;600;700&family=Amiri:wght@400;700&family=Noto+Serif+SC:wght@200;300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500;600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-[#000101]">
        <MagicParticles />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}