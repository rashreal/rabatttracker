export function formatDate(dateStr: string): string {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString('de-DE');
}

export function formatDateRange(from: string, to: string): string {
	return `${formatDate(from)} – ${formatDate(to)}`;
}

/** Days from today until `dateStr` (00:00 local), rounded. Negative if in the past. */
export function daysUntil(dateStr: string): number {
	const target = new Date(dateStr);
	if (isNaN(target.getTime())) return 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	target.setHours(0, 0, 0, 0);
	return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
