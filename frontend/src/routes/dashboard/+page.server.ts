import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { httpClient } from '$lib/server/http-client/http-client';
import { convertApiTradeListToUi } from '$lib/tradeConverters';
import {
	tradeFiltersFromFormData,
	tradeFiltersToSearchParams,
} from '$lib/filters/tradeFilters';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import type {
	ApiTradeListResponse,
	BalanceTransaction,
	PortfolioSummary,
	TradeFacets,
	TradeFilters,
} from '$lib/types';
import {
	ACTIVE_PORTFOLIO_COOKIE,
	resolvePortfolioIdFromCookie,
} from '$lib/portfolio/resolvePortfolioId';
import { fetchAllPortfolioTransactions } from '$lib/server/fetchAllPortfolioTransactions';

export const load = (async ({ parent, fetch, depends, cookies }) => {
	depends('dashboard:trades');
	depends('dashboard:facets');

	const { isAuthenticated, portfolios, user } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	const portfolioId = resolvePortfolioIdFromCookie(
		cookies.get(ACTIVE_PORTFOLIO_COOKIE),
		portfolios ?? [],
	);
	const plan = user?.plan ?? 'free';

	const defaultFilters: TradeFilters = {
		symbol: '',
		tradeType: 'all',
		tags: [],
		portfolioId,
	};
	const searchParams = tradeFiltersToSearchParams(defaultFilters, {
		status: 'closed',
		paginate: false,
	});

	const facetsParams =
		portfolioId != null
			? new URLSearchParams({ portfolio_id: String(portfolioId) })
			: undefined;

	const [closedTradesResponse, facetsResponse] = await Promise.all([
		httpClient.get<ApiTradeListResponse>('/trades', { fetch, searchParams }),
		httpClient.get<TradeFacets>('/trades/facets', {
			fetch,
			searchParams: facetsParams,
		}),
	]);

	const closedTrades = closedTradesResponse
		? convertApiTradeListToUi(closedTradesResponse)
		: { items: [], total: 0, limit: null, offset: 0 };

	// Pro/Max: load portfolio summary and full ledger for equity curve
	let portfolioSummary: PortfolioSummary | null = null;
	let transactions: BalanceTransaction[] = [];

	if ((plan === 'pro' || plan === 'max') && portfolioId != null) {
		try {
			const [summaryRes, allTx] = await Promise.all([
				httpClient.get<PortfolioSummary>(`/portfolios/${portfolioId}/summary`, {
					fetch,
				}),
				fetchAllPortfolioTransactions(fetch, portfolioId),
			]);
			portfolioSummary = summaryRes ?? null;
			transactions = allTx;
		} catch {
			// Non-fatal
		}
	}

	return {
		closedTrades,
		facets: facetsResponse,
		portfolioSummary,
		transactions,
		portfolioId,
		plan,
	};
}) satisfies PageServerLoad;

export const actions = {
	filterDashboard: async ({ request, fetch }) => {
		try {
			const formData = await request.formData();
			const filters = tradeFiltersFromFormData(formData);
			const searchParams = tradeFiltersToSearchParams(filters, {
				status: 'closed',
				paginate: false,
			});

			const response = await httpClient.get<ApiTradeListResponse>('/trades', {
				fetch,
				searchParams,
			});

			const result = response
				? convertApiTradeListToUi(response)
				: { items: [], total: 0, limit: null, offset: 0 };

			return { success: true, ...result };
		} catch (error) {
			return fail(500, { error });
		}
	},
} satisfies Actions;
