import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { convertApiTradeListToUi } from '$lib/tradeConverters';
import { httpClient } from '$lib/server/http-client/http-client';
import {
	tradeFiltersFromFormData,
	tradeFiltersToSearchParams,
} from '$lib/filters/tradeFilters';
import type {
	TradeFacets,
	TradeListResult,
	TradeSummary,
	TradeFilters,
	Trade,
	ApiTradeListResponse,
	PortfolioSummary,
} from '$lib/types';
import { TRADES_PAGE_SIZE } from '$lib/constants/trades';
import {
	ACTIVE_PORTFOLIO_COOKIE,
	resolvePortfolioIdFromCookie,
} from '$lib/portfolio/resolvePortfolioId';

async function fetchTradeList(
	fetch: typeof globalThis.fetch,
	searchParams: URLSearchParams,
): Promise<TradeListResult> {
	const response = await httpClient.get<ApiTradeListResponse>('/trades', {
		fetch,
		searchParams,
	});

	if (!response) {
		return { items: [], total: 0, limit: TRADES_PAGE_SIZE, offset: 0 };
	}

	return convertApiTradeListToUi(response);
}

async function fetchFacets(
	fetch: typeof globalThis.fetch,
	portfolioId?: number,
): Promise<TradeFacets> {
	const searchParams =
		portfolioId != null
			? new URLSearchParams({ portfolio_id: String(portfolioId) })
			: undefined;
	const response = await httpClient.get<TradeFacets>('/trades/facets', {
		fetch,
		searchParams,
	});
	return response;
}

async function fetchSummary(
	fetch: typeof globalThis.fetch,
	portfolioId?: number,
): Promise<TradeSummary> {
	const searchParams =
		portfolioId != null
			? new URLSearchParams({ portfolio_id: String(portfolioId) })
			: undefined;
	const response = await httpClient.get<TradeSummary>('/trades/summary', {
		fetch,
		searchParams,
	});
	return response;
}

async function fetchPortfolioSummary(
	fetch: typeof globalThis.fetch,
	portfolioId: number,
): Promise<PortfolioSummary | null> {
	try {
		return await httpClient.get<PortfolioSummary>(
			`/portfolios/${portfolioId}/summary`,
			{ fetch },
		);
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({
	url,
	fetch,
	depends,
	parent,
	cookies,
}) => {
	depends('journal:trades');
	depends('journal:facets');
	depends('journal:summary');

	const { isAuthenticated, portfolios, user } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	const plan = user?.plan ?? 'free';
	const portfolioId = resolvePortfolioIdFromCookie(
		cookies.get(ACTIVE_PORTFOLIO_COOKIE),
		portfolios ?? [],
	);
	const baseFilters: TradeFilters = {
		symbol: '',
		tradeType: 'all',
		tags: [],
		portfolioId,
	};

	const [openedTrades, closedTrades, facets, summary] = await Promise.all([
		fetchTradeList(
			fetch,
			tradeFiltersToSearchParams(baseFilters, {
				status: 'open',
				limit: TRADES_PAGE_SIZE,
				offset: 0,
			}),
		),
		fetchTradeList(
			fetch,
			tradeFiltersToSearchParams(baseFilters, {
				status: 'closed',
				limit: TRADES_PAGE_SIZE,
				offset: 0,
			}),
		),
		fetchFacets(fetch, portfolioId),
		fetchSummary(fetch, portfolioId),
	]);

	const portfolioSummary =
		(plan === 'pro' || plan === 'max') && portfolioId != null
			? await fetchPortfolioSummary(fetch, portfolioId)
			: null;

	const activePortfolio = portfolios?.find((p) => p.id === portfolioId) ?? null;

	return {
		openedTrades,
		closedTrades,
		facets,
		summary,
		portfolioSummary,
		portfolioId,
		plan,
		isArchived: activePortfolio?.status === 'archived',
		portfolios: portfolios ?? [],
	};
};

async function handleFilterAction(
	fetch: typeof globalThis.fetch,
	request: Request,
	status: 'open' | 'closed',
): Promise<{
	items: Trade[];
	total: number;
	limit: number | null;
	offset: number;
}> {
	const formData = await request.formData();
	const filters = tradeFiltersFromFormData(formData);
	const offset = Number(formData.get('offset') ?? 0);

	const result = await fetchTradeList(
		fetch,
		tradeFiltersToSearchParams(filters, {
			status,
			limit: TRADES_PAGE_SIZE,
			offset,
		}),
	);

	return result;
}

export const actions = {
	delete: async ({ request, fetch }) => {
		const formData = await request.formData();
		const tradeId = formData.get('tradeId');

		if (!tradeId || isNaN(Number(tradeId))) {
			return fail(400, { error: 'Invalid trade ID' });
		}

		try {
			await httpClient.delete(`/trades/${tradeId}`, { fetch });
			return { success: true };
		} catch (error) {
			return fail(500, { error });
		}
	},

	import: async ({ request, fetch }) => {
		const formData = await request.formData();

		try {
			await httpClient.sendFormData('/trades/import', formData, { fetch });
			return { success: true };
		} catch (error) {
			return fail(500, { error });
		}
	},

	filterOpened: async ({ request, fetch }) => {
		try {
			const result = await handleFilterAction(fetch, request, 'open');
			return { success: true, ...result };
		} catch (error) {
			return fail(500, { error });
		}
	},

	filterClosed: async ({ request, fetch }) => {
		try {
			const result = await handleFilterAction(fetch, request, 'closed');
			return { success: true, ...result };
		} catch (error) {
			return fail(500, { error });
		}
	},

	logout: async ({ cookies, fetch }) => {
		try {
			await httpClient.post('/auth/logout', {
				fetch,
			});
		} catch (error) {
			console.error('Logout error:', error);
		}

		cookies.set('access_token', '', {
			path: '/',
			expires: new Date(0),
			sameSite: 'lax',
		});
		cookies.set('refresh_token', '', {
			path: '/',
			expires: new Date(0),
			sameSite: 'lax',
		});
		throw redirect(303, '/login');
	},
} satisfies Actions;
