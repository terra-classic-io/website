import { getHyperlaneValidatorSnapshot, VALIDATOR_SNAPSHOT_TTL_MS } from "./hyperlane-validator-status";

// Cloudflare caches are local to a data center. The loader additionally coalesces
// simultaneous cache misses within one Worker instance. No global lock is assumed.
export async function hyperlaneValidatorResponse(requestUrl: string): Promise<Response> {
  const key = new URL(requestUrl);
  key.pathname = "/api/hyperlane/validators";
  key.search = "";
  let cache: Cache | undefined;
  try {
    if (typeof caches !== "undefined") {
      cache = await caches.open("hyperlane-validators-v2");
      const cached = await cache.match(key.toString());
      if (cached) return cached;
    }
  } catch (error) {
    console.warn("Hyperlane validator cache lookup failed", error);
  }

  const snapshot = await getHyperlaneValidatorSnapshot();
  // Do not grant an already cached in-memory snapshot another full minute.
  const remaining = Math.max(0, Math.floor((Date.parse(snapshot.fetchedAt) + VALIDATOR_SNAPSHOT_TTL_MS - Date.now()) / 1_000));
  const response = new Response(JSON.stringify(snapshot), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": remaining > 0 ? `public, max-age=${remaining}` : "no-store",
    },
  });
  if (cache && remaining > 0) {
    try {
      await cache.put(key.toString(), response.clone());
    } catch (error) {
      console.warn("Hyperlane validator cache write failed", error);
    }
  }
  return response;
}
