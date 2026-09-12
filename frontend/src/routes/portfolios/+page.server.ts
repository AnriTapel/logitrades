import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { httpClient } from '$lib/server/http-client/http-client';
import type {
	BalanceTransaction,
	Portfolio,
	PortfolioSummary,
} from '$lib/types';
import {
	ACTIVE_PORTFOLIO_COOKIE,
	resolvePortfolioIdFromCookie,
} from '$lib/portfolio/resolvePortfolioId';
import { fetchAllPortfolioTransactions } from '$lib/server/fetchAllPortfolioTransactions';
import { fetchPortfolioSummary } from '$lib/server/fetchPortfolioSummary';

const MAX_PORTFOLIOS = 5;

export const load: PageServerLoad = async ({ parent, fetch, cookies }) => {
	const { isAuthenticated, portfolios, user } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	const plan = user?.plan ?? 'free';
	const portfolioId = resolvePortfolioIdFromCookie(
		cookies.get(ACTIVE_PORTFOLIO_COOKIE),
		portfolios ?? [],
	);

	const activePortfolio = portfolios?.find((p) => p.id === portfolioId) ?? null;

	let portfolioSummary: PortfolioSummary | null = null;
	let transactions: BalanceTransaction[] = [];

	if ((plan === 'pro' || plan === 'max') && activePortfolio) {
		try {
			const [summaryRes, allTx] = await Promise.all([
				fetchPortfolioSummary(fetch, activePortfolio.id),
				fetchAllPortfolioTransactions(fetch, activePortfolio.id),
			]);
			portfolioSummary = summaryRes ?? null;
			transactions = allTx;
		} catch {
			// Non-fatal
		}
	}

	return {
		portfolios: portfolios ?? [],
		activePortfolio,
		portfolioSummary,
		transactions,
		plan,
		canCreateMore: plan === 'max' && (portfolios?.length ?? 0) < MAX_PORTFOLIOS,
	};
};

export const actions = {
	create: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		if (!name) {
			return fail(400, { error: 'Portfolio name is required' });
		}

		try {
			await httpClient.post('/portfolios', {
				payload: { name },
				fetch,
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to create portfolio' });
		}
	},

	rename: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const name = String(formData.get('name') ?? '').trim();

		if (!id || !name) {
			return fail(400, { error: 'Invalid data' });
		}

		try {
			await httpClient.patch(`/portfolios/${id}`, {
				payload: { name },
				fetch,
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to rename portfolio' });
		}
	},

	archive: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) return fail(400, { error: 'Invalid portfolio ID' });

		try {
			await httpClient.patch(`/portfolios/${id}`, {
				payload: { status: 'archived' },
				fetch,
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to archive portfolio' });
		}
	},

	unarchive: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) return fail(400, { error: 'Invalid portfolio ID' });

		try {
			await httpClient.patch(`/portfolios/${id}`, {
				payload: { status: 'active' },
				fetch,
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to unarchive portfolio' });
		}
	},

	delete: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) return fail(400, { error: 'Invalid portfolio ID' });

		try {
			await httpClient.delete(`/portfolios/${id}`, { fetch });
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to delete portfolio' });
		}
	},

	updateCapital: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const startingCapitalRaw = formData.get('starting_capital');
		const startedAt = formData.get('started_at');

		if (!id) return fail(400, { error: 'Invalid portfolio ID' });

		const starting_capital =
			startingCapitalRaw !== null && startingCapitalRaw !== ''
				? Number(startingCapitalRaw)
				: null;

		try {
			await httpClient.patch(`/portfolios/${id}`, {
				payload: {
					starting_capital,
					started_at: startedAt || null,
				},
				fetch,
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to update capital' });
		}
	},

	addTransaction: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const portfolioId = Number(formData.get('portfolio_id'));
		const type = String(formData.get('type'));
		const amount = Number(formData.get('amount'));
		const note = String(formData.get('note') ?? '').trim() || null;
		const occurred_at = String(formData.get('occurred_at') ?? '');

		if (!portfolioId || !['deposit', 'withdrawal'].includes(type) || !amount) {
			return fail(400, { error: 'Invalid transaction data' });
		}

		try {
			await httpClient.post(`/portfolios/${portfolioId}/transactions`, {
				payload: {
					type,
					amount,
					note,
					occurred_at: occurred_at || new Date().toISOString(),
				},
				fetch,
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to add transaction' });
		}
	},

	selectPortfolio: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (id) {
			cookies.set(ACTIVE_PORTFOLIO_COOKIE, String(id), {
				path: '/',
				maxAge: 60 * 60 * 24 * 365,
				sameSite: 'lax',
				httpOnly: false,
			});
		}
		return { success: true };
	},
} satisfies Actions;
