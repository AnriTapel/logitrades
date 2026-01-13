import type { Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { formSchema, type TradeFormInput } from '$lib/schemas/tradeSchemas';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import type { Trade } from '$lib/types';
import {
	convertUiTradeToTradeFormInput,
	convertApiTradeToUiTrade,
	normalizeTradeFormInputForApi,
} from '$lib/tradeConverters';
import { httpClient } from '$lib/server/http-client/http-client';

const sortTradesByClosedAt = (
	{ closedAt: closedAtA, openedAt: openedAtA }: Trade,
	{ closedAt: closedAtB, openedAt: openedAtB }: Trade
): number => {
	if (closedAtA && closedAtB) {
		return closedAtB.localeCompare(closedAtA);
	}

	if (closedAtA && !closedAtB) {
		return 1;
	}

	if (closedAtB && !closedAtA) {
		return -1;
	}

	return openedAtB.localeCompare(openedAtA);
};

export const load = async ({ url, fetch, locals }) => {
	// Redirect to login if not authenticated
	// User is set in handle hook (hooks.server.ts) before this runs
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const response = await httpClient.get<Trade[]>('/trades', { fetch });
	const trades =
		response?.map(convertApiTradeToUiTrade).sort(sortTradesByClosedAt) ?? [];
	// TODO :better way/place to handle edit mode
	const tradeId = url.searchParams.get('edit');
	let form;

	if (tradeId) {
		const tradeToEdit = trades.find((trade) => trade.id === Number(tradeId));
		form = tradeToEdit
			? await superValidate(
					convertUiTradeToTradeFormInput(tradeToEdit),
					zod(formSchema)
			  )
			: await superValidate(zod(formSchema));
	} else {
		form = await superValidate(zod(formSchema));
	}

	return { trades, form, isEditMode: tradeId !== null };
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

			return { success: true, form };
		} catch (error) {
			return fail(500, { form, error });
		}
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
			return fail(500, { form, error });
		}

		throw redirect(303, '?');
	},

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

	logout: async ({ cookies, fetch }) => {
		// Call backend logout to revoke refresh token in DB
		try {
			await httpClient.post('/auth/logout', {
				fetch, // Use event's fetch to forward cookies
			});
		} catch (error) {
			// Continue with logout even if backend call fails
			console.error('Logout error:', error);
		}

		// Clear cookies (backend also clears them, but do it here too for safety)
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
