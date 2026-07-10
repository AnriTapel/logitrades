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
	TradeFacets,
	TradeFilters,
} from '$lib/types';

export const load = (async ({ parent, fetch, depends }) => {
	depends('dashboard:trades');
	depends('dashboard:facets');

	const { isAuthenticated } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	const defaultFilters: TradeFilters = {
		symbol: '',
		tradeType: 'all',
		tags: [],
	};
	const searchParams = tradeFiltersToSearchParams(defaultFilters, {
		status: 'closed',
		paginate: false,
	});

	const [closedTradesResponse, facetsResponse] = await Promise.all([
		httpClient.get<ApiTradeListResponse>('/trades', { fetch, searchParams }),
		httpClient.get<TradeFacets>('/trades/facets', {
			fetch,
		}),
	]);

	const closedTrades = closedTradesResponse
		? convertApiTradeListToUi(closedTradesResponse)
		: { items: [], total: 0, limit: null, offset: 0 };

	return { closedTrades, facets: facetsResponse };
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
