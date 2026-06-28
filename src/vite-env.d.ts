/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ReputeX backend API (e.g. http://localhost:8787). */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
