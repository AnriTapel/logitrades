import type { Portfolio } from '$lib/types';
import { DEFAULT_CURRENCY } from '$lib/constants/currencies';

/**
 * Display currency: active portfolio wins when present, else user preference.
 */
export function effectiveCurrency(opts: {
	userCurrency?: string | null;
	activePortfolio?: Pick<Portfolio, 'currency'> | null;
}): string {
	return (
		opts.activePortfolio?.currency ??
		opts.userCurrency ??
		DEFAULT_CURRENCY
	);
}
