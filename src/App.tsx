import { Board } from './components/Board'
import { Metrics } from './components/Metrics'
import { SchemaErrors } from './components/SchemaErrors'
import { contentErrors, projects } from './content'

export default function App() {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <header className="mb-10">
          <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
            Superhuman SW
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">프로젝트 리스트</h1>
          <p className="mt-1 text-sm text-neutral-500">
            리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺는다.
          </p>
          <div className="mt-8">
            <Metrics projects={projects} />
          </div>
        </header>

        <SchemaErrors errors={contentErrors} />
        <Board projects={projects} />
      </div>
    </div>
  )
}
