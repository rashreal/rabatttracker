import { getPriceStats } from './price-observations';

export type PriceIndicatorLabel = 'top' | 'good' | 'normal' | 'bad' | 'new';

export interface PriceIndicator {
	label: PriceIndicatorLabel;
	displayText: string;
	minCents: number | null;
	maxCents: number | null;
	avgCents: number | null;
	sampleCount: number;
}

const WINDOW_DAYS = 180;
const MIN_DATA_POINTS = 3;

const LABELS: Record<PriceIndicatorLabel, string> = {
	top: 'Top-Preis',
	good: 'Guter Preis',
	normal: 'Normal',
	bad: 'Teuer',
	new: 'Neu / keine Historie'
};

export function computeIndicator(currentPriceCents: number, watchedProductId: number): PriceIndicator {
	const sinceIso = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
	const stats = getPriceStats(watchedProductId, sinceIso);

	if (stats.count < MIN_DATA_POINTS || stats.avg == null || stats.min == null) {
		return {
			label: 'new',
			displayText: LABELS.new,
			minCents: stats.min,
			maxCents: stats.max,
			avgCents: stats.avg,
			sampleCount: stats.count
		};
	}

	const { min, avg } = stats;
	let label: PriceIndicatorLabel;
	if (currentPriceCents <= min * 1.05) label = 'top';
	else if (currentPriceCents <= avg * 0.9) label = 'good';
	else if (currentPriceCents <= avg * 1.1) label = 'normal';
	else label = 'bad';

	return {
		label,
		displayText: LABELS[label],
		minCents: stats.min,
		maxCents: stats.max,
		avgCents: stats.avg,
		sampleCount: stats.count
	};
}
