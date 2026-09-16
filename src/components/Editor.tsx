import Image from '@tiptap/extension-image'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'
import { Markdown } from 'tiptap-markdown'
import { normalizeMarkdown, richEditorGate } from '../lib/markdown-rich'

export type UploadImage = (file: File) => Promise<string>

type Props = {
  value: string
  onChange: (markdown: string) => void
  onUploadImage?: UploadImage
  onUploadError?: (message: string) => void
  onUploadingChange?: (uploading: boolean) => void
}

/** tiptap-markdown이 타입을 넓혀주지 않아 여기서만 좁혀 쓴다. */
type MarkdownStorage = { markdown: { getMarkdown: () => string } }
const toMarkdown = (editor: { storage: unknown }) =>
  (editor.storage as MarkdownStorage).markdown.getMarkdown()

const BTN = 'rounded px-2 py-1 text-xs text-ink-soft hover:bg-accent/10 disabled:opacity-30'

/** 클립보드에서 이미지 파일만 골라낸다. 글자를 복사했을 때는 빈 배열이다. */
const imagesFrom = (data: DataTransfer | null): File[] =>
  Array.from(data?.files ?? []).filter((f) => f.type.startsWith('image/'))

function RichEditor({ value, onChange, onUploadImage, onUploadError, onUploadingChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Markdown.configure({ html: false, breaks: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(toMarkdown(editor)),
    editorProps: {
      attributes: {
        class:
          'prose-editor min-h-72 rounded-b-lg border border-t-0 border-rule bg-leaf px-4 py-3 text-sm leading-relaxed outline-none',
      },
      handlePaste: (view, event) => {
        const images = imagesFrom(event.clipboardData)
        if (images.length === 0 || !onUploadImage) return false
        event.preventDefault()

        void (async () => {
          onUploadingChange?.(true)
          try {
            for (const file of images) {
              const src = await onUploadImage(file)
              const node = view.state.schema.nodes.image.create({ src })
              view.dispatch(view.state.tr.replaceSelectionWith(node))
            }
          } catch (e) {
            onUploadError?.(e instanceof Error ? e.message : '이미지를 올리지 못했다')
          } finally {
            onUploadingChange?.(false)
          }
        })()

        return true
      },
    },
  })

  if (!editor) return null

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs) ? 'bg-rule-soft ' : ''

  return (
    <div>
      <div className="flex flex-wrap gap-0.5 rounded-t-lg border border-rule bg-paper p-1">
        <button
          type="button"
          className={active('heading', { level: 2 }) + BTN}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          제목
        </button>
        <button
          type="button"
          className={active('heading', { level: 3 }) + BTN}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          소제목
        </button>
        <button
          type="button"
          className={active('bold') + BTN}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          굵게
        </button>
        <button
          type="button"
          className={active('italic') + BTN}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          기울임
        </button>
        <button
          type="button"
          className={active('bulletList') + BTN}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          목록
        </button>
        <button
          type="button"
          className={active('orderedList') + BTN}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          번호
        </button>
        <button
          type="button"
          className={active('blockquote') + BTN}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          인용
        </button>
        <button
          type="button"
          className={active('codeBlock') + BTN}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          코드
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function RawEditor({ value, onChange, onUploadImage, onUploadError, onUploadingChange }: Props) {
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const images = imagesFrom(e.clipboardData)
    if (images.length === 0 || !onUploadImage) return
    e.preventDefault()

    const target = e.currentTarget
    const at = target.selectionStart

    void (async () => {
      onUploadingChange?.(true)
      try {
        const urls: string[] = []
        for (const file of images) urls.push(await onUploadImage(file))
        const markdown = urls.map((u) => `![](${u})`).join('\n')
        onChange(`${value.slice(0, at)}${markdown}${value.slice(target.selectionEnd)}`)
      } catch (err) {
        onUploadError?.(err instanceof Error ? err.message : '이미지를 올리지 못했다')
      } finally {
        onUploadingChange?.(false)
      }
    })()
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onPaste={handlePaste}
      spellCheck={false}
      className="min-h-72 w-full rounded-lg border border-rule bg-leaf px-4 py-3 font-mono text-xs leading-relaxed focus:border-accent"
    />
  )
}

/**
 * 리치 편집기는 마크다운이 아니라 ProseMirror를 왕복시킨다.
 * 편집기가 모르는 문법이 든 글은 애초에 열지 않고 원문 모드로 연다.
 */
export function Editor({
  value,
  onChange,
  raw,
  onToggleRaw,
  onUploadImage,
}: Props & { raw: boolean; onToggleRaw: (raw: boolean) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gate = richEditorGate(value)
  const forced = !gate.safe

  const shared = {
    onUploadImage,
    onUploadError: setError,
    onUploadingChange: (busy: boolean) => {
      setUploading(busy)
      if (busy) setError(null)
    },
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {forced ? (
            <>
              <span className="font-medium text-ink">{gate.reason}</span>가 들어 있어 원문
              그대로 편집한다. 서식 편집기를 쓰면 이 부분이 사라진다.
            </>
          ) : (
            '본문 · 이미지는 그대로 붙여넣으면 된다'
          )}
        </p>
        {!forced && (
          <button
            type="button"
            onClick={() => onToggleRaw(!raw)}
            className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-ink"
          >
            {raw ? '서식 편집기로' : '원문으로'}
          </button>
        )}
      </div>

      {forced || raw ? (
        <RawEditor value={value} onChange={onChange} {...shared} />
      ) : (
        <RichEditor value={value} onChange={(md) => onChange(normalizeMarkdown(md))} {...shared} />
      )}

      {uploading && <p className="mt-2 text-xs text-muted">이미지 올리는 중…</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
