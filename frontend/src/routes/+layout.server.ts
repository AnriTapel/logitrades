import type { LayoutServerLoad } from './$types';
import { httpClient } from '$lib/server/http-client/http-client';
import type { Portfolio } from '$lib/types';
import {
	ACTIVE_PORTFOLIO_COOKIE,
	resolvePortfolioIdFromCookieOnly,
} from '$lib/portfolio/resolvePortfolioId';

const BASE_LAYOUT_ROUTES = ['/journal', '/portfolios', '/dashboard', '/trade'];

const isBaseLayoutRoute = (pathname: string) => {
	return BASE_LAYOUT_ROUTES.some((route) => pathname.startsWith(route));
};

export const load: LayoutServerLoad = async ({
	locals,
	url,
	fetch,
	cookies,
}) => {
	let portfolios: Portfolio[] = [];

	if (locals.user) {
		try {
			const result = await httpClient.get<Portfolio[]>('/portfolios', {
				fetch,
			});
			if (result) portfolios = result;
		} catch {
			// Non-fatal — render with empty portfolios
		}
	}

	const activePortfolioId = resolvePortfolioIdFromCookieOnly(
		cookies.get(ACTIVE_PORTFOLIO_COOKIE),
		portfolios,
	);

	return {
		isAuthenticated: !!locals.user,
		user: locals.user,
		showAppChrome: isBaseLayoutRoute(url.pathname),
		portfolios,
		activePortfolioId,
	};
};
