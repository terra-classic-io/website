type CancelScheduledTask = () => void;

const DEFAULT_DELAY_MS = 2_500;
const IDLE_TIMEOUT_MS = 1_500;

/**
 * Run client-only work after the initial page load has had time to paint.
 * The timeout keeps live data responsive while avoiding competition with LCP.
 */
export function scheduleNonCriticalTask(
  task: () => void,
  delayMs: number = DEFAULT_DELAY_MS
): CancelScheduledTask {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let delayId: number | undefined;
  let idleId: number | undefined;
  let isCancelled = false;

  const runTask = (): void => {
    if (isCancelled) {
      return;
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(
        () => {
          if (!isCancelled) {
            task();
          }
        },
        { timeout: IDLE_TIMEOUT_MS }
      );
      return;
    }

    task();
  };

  const queueTask = (): void => {
    delayId = window.setTimeout(runTask, delayMs);
  };

  if (document.readyState === "complete") {
    queueTask();
  } else {
    window.addEventListener("load", queueTask, { once: true });
  }

  return () => {
    isCancelled = true;
    window.removeEventListener("load", queueTask);

    if (typeof delayId === "number") {
      window.clearTimeout(delayId);
    }
    if (typeof idleId === "number" && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
  };
}
