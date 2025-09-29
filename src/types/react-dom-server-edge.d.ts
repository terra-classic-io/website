declare module 'react-dom/server.edge' {
  import type { ReactElement } from 'react';

  /**
   * Minimal type for React 18 Edge runtime SSR API.
   * On Cloudflare Workers, renderToReadableStream returns a ReadableStream
   * and may expose an `allReady` Promise on the stream instance.
   */
  export function renderToReadableStream(
    element: ReactElement,
    options?: unknown
  ): Promise<ReadableStream<Uint8Array>> | ReadableStream<Uint8Array>;
}
