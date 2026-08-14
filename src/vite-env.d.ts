/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VYNTREX_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
