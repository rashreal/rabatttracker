/** Retries a transient failure (e.g. network blip) with a short delay between attempts. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 1000): Promise<T> {
	let lastError: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn();
		} catch (e) {
			lastError = e;
			if (i < attempts - 1) {
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
	}
	throw lastError;
}
