import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import {
	createTradeFormDefaults,
	formSchema,
	type TradeFormInput,
} from '$lib/schemas/tradeSchemas';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from '$lib/superform/zod';
import {
	convertApiTradeToUiTrade,
	convertUiTradeToTradeFormInput,
	normalizeTradeFormInputForApi,
} from '$lib/tradeConverters';
import { httpClient } from '$lib/server/http-client/http-client';
import type { ApiTrade, TradeFacets } from '$lib/types';
import { fetchPortfolioSummary } from '$lib/server/fetchPortfolioSummary';
import {
	ACTIVE_PORTFOLIO_COOKIE,
	resolvePortfolioIdFromCookie,
} from '$lib/portfolio/resolvePortfolioId';

async function fetchFacets(
	fetch: typeof globalThis.fetch,
	portfolioId?: number,
): Promise<TradeFacets> {
	const searchParams =
		portfolioId != null
			? new URLSearchParams({ portfolio_id: String(portfolioId) })
			: undefined;
	return await httpClient.get<TradeFacets>('/trades/facets', {
		fetch,
		searchParams,
	});
}

export const load: PageServerLoad = async ({ url, fetch, parent, cookies }) => {
	const { isAuthenticated, portfolios, user } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	const plan = user?.plan ?? 'free';
	const portfolioId = resolvePortfolioIdFromCookie(
		cookies.get(ACTIVE_PORTFOLIO_COOKIE),
		portfolios ?? [],
	);
	const tradeId = url.searchParams.get('edit');
	const facets = await fetchFacets(fetch, portfolioId);

	const portfolioSummary =
		(plan === 'pro' || plan === 'max') && portfolioId != null
			? await fetchPortfolioSummary(fetch, portfolioId)
			: null;

	let form;
	if (tradeId) {
		const apiTrade = await httpClient.get<ApiTrade>(`/trades/${tradeId}`, {
			fetch,
		});
		const tradeToEdit = apiTrade ? convertApiTradeToUiTrade(apiTrade) : null;
		form = tradeToEdit
			? await superValidate(
					convertUiTradeToTradeFormInput(tradeToEdit),
					zod(formSchema),
				)
			: await superValidate(zod(formSchema), {
					errors: false,
					defaults: createTradeFormDefaults(),
				});
	} else {
		const defaults = createTradeFormDefaults();
		defaults.portfolioId = portfolioId;
		form = await superValidate(zod(formSchema), {
			errors: false,
			defaults,
		});
	}

	return {
		form,
		facets,
		isEditMode: tradeId !== null,
		portfolioId,
		plan,
		portfolios: portfolios ?? [],
		portfolioSummary,
		userCurrency: user?.currency,
	};
};

export const actions = {
	create: async ({ request, fetch }) => {
		const form = await superValidate<TradeFormInput>(request, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Form validation failed. Please check your input.',
			});
		}

		try {
			await httpClient.post<TradeFormInput, unknown>('/trades', {
				payload: normalizeTradeFormInputForApi(form.data),
				fetch,
			});
		} catch (error) {
			return fail(500, {
				form,
				error,
			});
		}

		throw redirect(303, '/journal');
	},

	update: async ({ request, fetch }) => {
		const form = await superValidate(request, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Form validation failed. Please check your input.',
			});
		}

		try {
			await httpClient.put<TradeFormInput>(`/trades/${form.data.id}`, {
				payload: normalizeTradeFormInputForApi(form.data),
				fetch,
			});
		} catch (error) {
			return fail(500, {
				form,
				error,
			});
		}

		throw redirect(303, '/journal');
	},
} satisfies Actions;
