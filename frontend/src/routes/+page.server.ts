import type { Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { formSchema, type TradeFormInput } from '../lib/schemas/tradeSchemas';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import type { Trade } from '$lib/types';
import {
	convertUiTradeToTradeFormInput,
	convertApiTradeToUiTrade,
} from '$lib/tradeConverters';
import { httpClient } from '$lib/services/http-client/http-client';

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

const loadTrades = async (): Promise<Trade[]> => {
	const BASE_URL = 'http://localhost:8000/api/v1/trades/';
	const response = await fetch(BASE_URL);
	if (!response.ok) {
		throw new Error('Failed to fetch trades');
	}
	const trades = await response.json();
	return trades.map(convertApiTradeToUiTrade).sort(sortTradesByClosedAt);
};

export const load = async ({ url }) => {
	const trades = await loadTrades();
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
	create: async (event) => {
		const form = await superValidate<TradeFormInput>(event, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Form validation failed. Please check your input.',
			});
		}

		try {
			await httpClient.post<TradeFormInput, unknown>(
				'http://localhost:8000/api/v1/trades/',
				{
					payload: form.data,
				}
			);

			return { success: true, form };
		} catch (error) {
			return fail(500, { form, error });
		}
	},

	update: async (event) => {
		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Form validation failed. Please check your input.',
			});
		}

		try {
			await httpClient.put<TradeFormInput>(
				`http://localhost:8000/api/v1/trades/${form.data.id}`,
				{
					payload: form.data,
				}
			);
		} catch (error) {
			return fail(500, { form, error });
		}

		throw redirect(303, '?');
	},
} satisfies Actions;
