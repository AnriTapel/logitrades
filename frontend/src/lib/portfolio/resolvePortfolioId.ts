import type { Portfolio } from '$lib/types';

export const ACTIVE_PORTFOLIO_COOKIE = 'last_active_portfolio_id';

/**
 * Resolve active portfolio for SSR from cookie value.
 * Priority: valid cookie id → default → first owned.
 */
export function resolvePortfolioIdFromCookie(
	cookieRaw: string | undefined,
	portfolios: Portfolio[],
): number | undefined {
	if (portfolios.length === 0) return undefined;

	if (cookieRaw) {
		const id = parseInt(cookieRaw, 10);
		if (!isNaN(id) && portfolios.some((p) => p.id === id)) {
			return id;
		}
	}

	return portfolios.find((p) => p.is_default)?.id ?? portfolios[0]?.id;
}

/**
 * Cookie-only resolve (no default fallback). Used by root layout so the client
 * can still promote localStorage before locking SSR to the default portfolio.
 */
export function resolvePortfolioIdFromCookieOnly(
	cookieRaw: string | undefined,
	portfolios: Portfolio[],
): number | undefined {
	if (!cookieRaw || portfolios.length === 0) return undefined;
	const id = parseInt(cookieRaw, 10);
	if (isNaN(id)) return undefined;
	return portfolios.some((p) => p.id === id) ? id : undefined;
}
