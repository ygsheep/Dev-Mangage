/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string | 'http://localhost:3000/api'
  // 可以在这里添加更多环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
