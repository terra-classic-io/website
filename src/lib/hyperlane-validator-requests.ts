// One budget covers all LCD/RPC fallbacks and checkpoint reads in a snapshot.
export const VALIDATOR_REQUEST_LIMITS = {
  requests: 48,
  concurrency: 6,
  requestTimeoutMs: 8_000,
  snapshotTimeoutMs: 20_000,
  responseBytes: 1_048_576,
} as const;

type RequestLimits = { readonly [Key in keyof typeof VALIDATOR_REQUEST_LIMITS]: number };

export function createValidatorRequests(limits: RequestLimits = VALIDATOR_REQUEST_LIMITS) {
  const deadline = new AbortController();
  const deadlineTimer = setTimeout(() => deadline.abort(), limits.snapshotTimeoutMs);
  const waiting: (() => void)[] = [];
  let active = 0;
  let requests = 0;

  async function read(input: string, init?: RequestInit): Promise<{ text: string; headers: Headers }> {
    if (deadline.signal.aborted || requests >= limits.requests) {
      throw new Error("Validator snapshot request budget exhausted.");
    }
    requests++;
    if (active >= limits.concurrency) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    } else {
      active++;
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    deadline.signal.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, limits.requestTimeoutMs);
    let onAbort: () => void = () => {};
    try {
      if (deadline.signal.aborted) throw new Error("Validator snapshot deadline exceeded.");
      const aborted = new Promise<never>((_, reject) => {
        onAbort = () => reject(new Error("Validator request timed out."));
        controller.signal.addEventListener("abort", onAbort, { once: true });
      });
      // Keep timeouts and concurrency slots active until the body has been read.
      return await Promise.race([aborted, (async () => {
        const response = await fetch(input, { ...init, signal: controller.signal, redirect: "error" });
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error(`Request failed with status ${response.status}.`);
        }
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let text = "";
        let bytes = 0;
        try {
          if (reader) {
            while (true) {
              const chunk = await reader.read();
              if (chunk.done) break;
              bytes += chunk.value.byteLength;
              if (bytes > limits.responseBytes) throw new Error("Validator response exceeds size limit.");
              text += decoder.decode(chunk.value, { stream: true });
            }
          }
          return { text: text + decoder.decode(), headers: response.headers };
        } finally {
          await reader?.cancel();
        }
      })()]);
    } finally {
      clearTimeout(timeout);
      deadline.signal.removeEventListener("abort", abort);
      controller.signal.removeEventListener("abort", onAbort);
      controller.abort();
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  }

  return {
    read,
    async json(input: string, init?: RequestInit): Promise<unknown> {
      return JSON.parse((await read(input, init)).text) as unknown;
    },
    dispose() {
      clearTimeout(deadlineTimer);
      deadline.abort();
    },
  };
}

export type ValidatorRequests = ReturnType<typeof createValidatorRequests>;
