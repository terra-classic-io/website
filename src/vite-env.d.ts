/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VYNTREX_API_KEY?: string;
  readonly VITE_VYNTREX_MARKET_CAP_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
