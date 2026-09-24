import { ProviderTimeoutError, ProviderUnavailableError } from "../weather/errors";

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
  providerName?: string;
}

/**
 * Bounded fetch execution helper with automatic AbortController and timeout classification.
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = 3000, providerName = "upstream", ...requestInit } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Link signal if one was already passed
  if (requestInit.signal) {
    requestInit.signal.addEventListener("abort", () => {
      controller.abort();
    });
  }

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderTimeoutError(providerName, `${providerName} request timed out after ${timeoutMs}ms.`);
    }

    if (error instanceof TypeError) {
      throw new ProviderUnavailableError(`Network failure communicating with ${providerName}: ${error.message}`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
