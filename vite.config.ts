import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { API_BASE } from './src/config'

const CSP = [
  "default-src 'self'",
  // 편집 서버 말고는 아무 데도 부르지 않는다. 서드파티 스크립트는 하나도 싣지 않는다.
  ["connect-src 'self'", API_BASE].filter(Boolean).join(' '),
  "img-src 'self' https: data:",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ')

/** 프로덕션 빌드에만 CSP를 심는다. 개발 서버는 HMR 인라인 스크립트와 웹소켓을 쓰므로 제외. */
const csp = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '</head>',
      `  <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n  </head>`,
    ),
})

/** GitHub Pages는 SPA 딥링크를 404로 떨군다. index.html을 404.html로 복사해 받아낸다. */
const spaFallback = (): Plugin => ({
  name: 'spa-fallback-404',
  apply: 'build',
  closeBundle() {
    const dist = resolve(import.meta.dirname, 'dist')
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
  },
})

export default defineConfig({
  base: '/superhuman-sw/',
  plugins: [react(), tailwindcss(), csp(), spaFallback()],
  define: {
    __BUILD_SHA__: JSON.stringify(process.env.GITHUB_SHA ?? 'dev'),
  },
})
