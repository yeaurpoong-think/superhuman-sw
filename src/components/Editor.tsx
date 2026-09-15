import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { normalizeMarkdown, richEditorGate } from '../lib/markdown-rich'

type Props = {
  value: string
  onChange: (markdown: string) => void
}

/** tiptap-markdown이 타입을 넓혀주지 않아 여기서만 좁혀 쓴다. */
type MarkdownStorage = { markdown: { getMarkdown: () => string } }
const toMarkdown = (editor: { storage: unknown }) =>
  (editor.storage as MarkdownStorage).markdown.getMarkdown()

const BTN =
  'rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200 disabled:opacity-30'

function RichEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown.configure({ html: false, breaks: false })],
    content: value,
    onUpdate: ({ editor }) => onChange(toMarkdown(editor)),
    editorProps: {
      attributes: {
        class:
          'prose-editor min-h-72 rounded-b-lg border border-t-0 border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none',
      },
    },
  })

  if (!editor) return null

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs) ? 'bg-neutral-200 ' : ''

  return (
    <div>
      <div className="flex flex-wrap gap-0.5 rounded-t-lg border border-neutral-200 bg-neutral-50 p-1">
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

function RawEditor({ value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="min-h-72 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 font-mono text-xs leading-relaxed outline-none focus:border-neutral-400"
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
}: Props & { raw: boolean; onToggleRaw: (raw: boolean) => void }) {
  const gate = richEditorGate(value)
  const forced = !gate.safe

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {forced ? (
            <>
              <span className="font-medium text-neutral-700">{gate.reason}</span>가 들어 있어 원문
              그대로 편집한다. 서식 편집기를 쓰면 이 부분이 사라진다.
            </>
          ) : (
            '본문'
          )}
        </p>
        {!forced && (
          <button
            type="button"
            onClick={() => onToggleRaw(!raw)}
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
          >
            {raw ? '서식 편집기로' : '원문으로'}
          </button>
        )}
      </div>

      {forced || raw ? (
        <RawEditor value={value} onChange={onChange} />
      ) : (
        <RichEditor value={value} onChange={(md) => onChange(normalizeMarkdown(md))} />
      )}
    </div>
  )
}
