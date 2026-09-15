import type { Project } from './lib/schema'
import raw from './generated/projects.json'

/** 빌드 시점에 구워 넣은 콘텐츠. 방문자는 이것만 받는다. */
export type ProjectRecord = Project & { body: string; file: string }
export type ContentError = { file: string; issues: string[] }

const data = raw as unknown as { projects: ProjectRecord[]; errors: ContentError[] }

export const projects: ProjectRecord[] = data.projects
export const contentErrors: ContentError[] = data.errors
