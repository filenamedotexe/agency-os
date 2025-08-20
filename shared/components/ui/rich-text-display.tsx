"use client"

import { cn } from '@/shared/lib/utils'

interface RichTextDisplayProps {
  content?: string | object | null
  className?: string
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  if (!content) return null

  // Convert content to HTML string if it's an object (TipTap JSON)
  let htmlContent: string = ''
  
  if (typeof content === 'string') {
    htmlContent = content
  } else if (typeof content === 'object' && content !== null) {
    // Convert TipTap JSON to HTML (basic conversion)
    htmlContent = convertTipTapToHTML(content)
  }

  if (!htmlContent.trim()) return null

  return (
    <div 
      className={cn(
        'prose prose-sm max-w-none',
        'prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-p:leading-6 prose-p:my-2',
        'prose-ul:my-2 prose-ol:my-2 prose-li:my-1',
        'prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4',
        'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
        'prose-img:rounded-lg prose-img:shadow-sm prose-img:max-w-full',
        'dark:prose-invert',
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

// Basic TipTap JSON to HTML converter
function convertTipTapToHTML(json: any): string {
  if (!json || typeof json !== 'object') return ''
  
  if (json.type === 'doc' && Array.isArray(json.content)) {
    return json.content.map((node: any) => convertNodeToHTML(node)).join('')
  }
  
  return convertNodeToHTML(json)
}

function convertNodeToHTML(node: any): string {
  if (!node || typeof node !== 'object') return ''
  
  const { type, content, attrs, marks } = node
  
  switch (type) {
    case 'paragraph':
      const pContent = Array.isArray(content) 
        ? content.map(convertNodeToHTML).join('') 
        : ''
      return `<p>${pContent}</p>`
      
    case 'heading':
      const level = attrs?.level || 1
      const hContent = Array.isArray(content) 
        ? content.map(convertNodeToHTML).join('') 
        : ''
      return `<h${level}>${hContent}</h${level}>`
      
    case 'bulletList':
      const ulContent = Array.isArray(content) 
        ? content.map(convertNodeToHTML).join('') 
        : ''
      return `<ul>${ulContent}</ul>`
      
    case 'orderedList':
      const olContent = Array.isArray(content) 
        ? content.map(convertNodeToHTML).join('') 
        : ''
      return `<ol>${olContent}</ol>`
      
    case 'listItem':
      const liContent = Array.isArray(content) 
        ? content.map(convertNodeToHTML).join('') 
        : ''
      return `<li>${liContent}</li>`
      
    case 'blockquote':
      const blockContent = Array.isArray(content) 
        ? content.map(convertNodeToHTML).join('') 
        : ''
      return `<blockquote>${blockContent}</blockquote>`
      
    case 'image':
      const src = attrs?.src || ''
      const alt = attrs?.alt || ''
      return `<img src="${src}" alt="${alt}" />`
      
    case 'text':
      let text = node.text || ''
      
      // Apply marks (formatting)
      if (Array.isArray(marks)) {
        marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`
              break
            case 'italic':
              text = `<em>${text}</em>`
              break
            case 'code':
              text = `<code>${text}</code>`
              break
            case 'strike':
              text = `<s>${text}</s>`
              break
            case 'link':
              const href = mark.attrs?.href || '#'
              text = `<a href="${href}" class="text-primary underline underline-offset-2">${text}</a>`
              break
          }
        })
      }
      
      return text
      
    default:
      // Fallback for unknown node types
      if (Array.isArray(content)) {
        return content.map(convertNodeToHTML).join('')
      }
      return ''
  }
}