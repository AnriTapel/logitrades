/**
 * Unit tests for resolveActivePortfolioId helper.
 *
 * Note: localStorage interactions are tested via mocking since
 * the store itself requires a browser environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Portfolio } from '$lib/types';

// Mock $app/environment with browser: true so localStorage reads are executed.
vi.mock('$app/environment', () => ({ browser: true }));

import { resolveActivePortfolioId } from '$lib/stores/active-portfolio';

const makePortfolio = (
	id: number,
	opts: Partial<Portfolio> = {},
): Portfolio => ({
	id,
	user_id: 1,
	name: `Portfolio ${id}`,
	is_default: false,
	status: 'active',
	starting_capital: 0,
	started_at: null,
	created_at: '2025-01-01T00:00:00Z',
	...opts,
});

describe('resolveActivePortfolioId', () => {
	beforeEach(() => {
		// localStorage is not available in Node; provide a minimal mock
		vi.stubGlobal('localStorage', {
			getItem: vi.fn().mockReturnValue(null),
			setItem: vi.fn(),
			removeItem: vi.fn(),
		});
		vi.stubGlobal('document', { cookie: '' });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns null for empty list', () => {
		expect(resolveActivePortfolioId([])).toBeNull();
	});

	it('returns is_default when no lastActive stored', () => {
		const portfolios = [
			makePortfolio(1),
			makePortfolio(2, { is_default: true }),
			makePortfolio(3),
		];
		expect(resolveActivePortfolioId(portfolios)).toBe(2);
	});

	it('returns lastActive when it is still owned', () => {
		(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('10');
		const portfolios = [makePortfolio(10), makePortfolio(2, { is_default: true })];
		expect(resolveActivePortfolioId(portfolios)).toBe(10);
	});

	it('falls back to is_default when lastActive is not owned', () => {
		(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('999');
		const portfolios = [
			makePortfolio(1),
			makePortfolio(3, { is_default: true }),
		];
		expect(resolveActivePortfolioId(portfolios)).toBe(3);
	});

	it('falls back to first portfolio when no default and no lastActive', () => {
		const portfolios = [makePortfolio(1), makePortfolio(5)];
		expect(resolveActivePortfolioId(portfolios)).toBe(1);
	});

	it('prefers lastActive over is_default', () => {
		(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('5');
		const portfolios = [
			makePortfolio(1, { is_default: true }),
			makePortfolio(5),
		];
		expect(resolveActivePortfolioId(portfolios)).toBe(5);
	});

	it('prefers cookie over lastActive localStorage', () => {
		(document as { cookie: string }).cookie = 'last_active_portfolio_id=2';
		(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('10');
		const portfolios = [
			makePortfolio(10),
			makePortfolio(2, { is_default: true }),
		];
		expect(resolveActivePortfolioId(portfolios)).toBe(2);
	});

	it('returns first when lastActive missing and no is_default', () => {
		(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
		const portfolios = [makePortfolio(1), makePortfolio(2)];
		expect(resolveActivePortfolioId(portfolios)).toBe(1);
	});
});
