import { describe, it, expect } from 'vitest';
import { effectiveCurrency } from '$lib/portfolio/effectiveCurrency';
import type { Portfolio } from '$lib/types';

const portfolio = (currency: string): Pick<Portfolio, 'currency'> => ({
	currency,
});

describe('effectiveCurrency', () => {
	it('prefers active portfolio currency', () => {
		expect(
			effectiveCurrency({
				userCurrency: 'USD',
				activePortfolio: portfolio('EUR'),
			}),
		).toBe('EUR');
	});

	it('falls back to user currency', () => {
		expect(
			effectiveCurrency({
				userCurrency: 'GBP',
				activePortfolio: null,
			}),
		).toBe('GBP');
	});

	it('falls back to USD when nothing set', () => {
		expect(effectiveCurrency({})).toBe('USD');
	});
});
