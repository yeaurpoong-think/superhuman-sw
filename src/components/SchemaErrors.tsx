import type { ContentError } from '../content'

/** 계약을 어긴 파일이 있어도 보드는 살아 있어야 한다. 어디가 깨졌는지만 알려준다. */
export function SchemaErrors({ errors }: { errors: ContentError[] }) {
  if (errors.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-medium text-red-900">
        형식이 어긋난 파일 {errors.length}개 — 보드에 올라가지 않았습니다
      </h2>
      <ul className="mt-2 space-y-1.5">
        {errors.map((e) => (
          <li key={e.file} className="text-xs text-red-800">
            <code className="font-medium">{e.file}</code>
            <ul className="mt-0.5 ml-4 list-disc text-red-700/80">
              {e.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
