/**
 * Node's fetch() wraps low-level network failures (DNS, connection refused,
 * TLS, timeout) in a generic `TypeError: fetch failed` with the real reason
 * only available on `error.cause`. Surface that so error messages are
 * actually actionable instead of just "fetch failed".
 */
export function describeError(e: unknown): string {
	if (!(e instanceof Error)) return String(e);

	const cause = (e as { cause?: unknown }).cause;
	if (!cause) return e.message;

	const causeText = cause instanceof Error ? cause.message : String(cause);
	return `${e.message}: ${causeText}`;
}
