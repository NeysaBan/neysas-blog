'use client'

import { useEffect } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'

interface CodeHighlightProps {
  content: string
}

export function CodeHighlight({ content }: CodeHighlightProps) {
  useEffect(() => {
    Prism.highlightAll()
  }, [content])

  // 解析内容中的代码块
  const parseContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n')
        const language = lines[0].replace('```', '').trim() || 'javascript'
        const code = lines.slice(1, -1).join('\n')
        
        return (
          <div key={index} className="my-6">
            <div className="bg-[#000101] rounded-t-lg px-4 py-2 border-b border-[#733657]/30">
              <span className="text-[#e8a917] text-sm font-medium">
                {language.toUpperCase()}
              </span>
            </div>
            <pre className={`language-${language} !mt-0 !rounded-t-none`}>
              <code className={`language-${language}`}>
                {code}
              </code>
            </pre>
          </div>
        )
      }
      
      // 处理普通文本中的行内代码
      const inlineCodeParts = part.split(/(`[^`]+`)/g)
      return (
        <div key={index}>
          {inlineCodeParts.map((inlinePart, inlineIndex) => {
            if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
              return (
                <code 
                  key={inlineIndex}
                  className="bg-[#000101] text-[#e8a917] px-2 py-1 rounded text-sm font-mono border border-[#733657]/30"
                >
                  {inlinePart.slice(1, -1)}
                </code>
              )
            }
            
            // 处理段落
            return inlinePart.split('\n\n').map((paragraph, pIndex) => {
              if (paragraph.trim()) {
                return (
                  <p key={`${inlineIndex}-${pIndex}`} className="mb-4">
                    {paragraph.trim()}
                  </p>
                )
              }
              return null
            })
          })}
        </div>
      )
    })
  }

  return <div>{parseContent(content)}</div>
}