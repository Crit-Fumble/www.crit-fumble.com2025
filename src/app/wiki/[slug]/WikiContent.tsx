'use client'

import dynamic from 'next/dynamic'

// Dynamic import for markdown preview (client-only)
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
)

interface WikiContentProps {
  content: string
}

export function WikiContent({ content }: WikiContentProps) {
  return (
    <article className="prose prose-invert prose-lg max-w-none" data-color-mode="dark">
      <MDPreview source={content} />
    </article>
  )
}
