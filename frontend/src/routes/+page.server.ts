import type { Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { formSchema } from './schema';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import type { Trade } from '$lib/types';
import {
	convertUiTradeToTradeFormInput,
	convertApiTradeToUiTrade,
	convertUiTradeFormToApiTrade,
} from '$lib/tradeConverters';

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
	console.log(trades);
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

	return { trades, form };
};

export const actions = {
	create: async (event) => {
		console.log('create event');
		const form = await superValidate(event, zod(formSchema));
		console.log(form.errors);
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Form validation failed. Please check your input.',
			});
		}

		const response = await fetch('http://localhost:8000/api/v1/trades/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(convertUiTradeFormToApiTrade(form.data)),
		});

		if (!response.ok) {
			return fail(500, { form, error: 'Failed to save trade.' });
		}

		return { form };
	},

	update: async (event) => {
		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Form validation failed. Please check your input.',
			});
		}

		const response = await fetch(
			`http://localhost:8000/api/v1/trades/${form.data.id}`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(convertUiTradeFormToApiTrade(form.data)),
			}
		);

		if (!response.ok) {
			return fail(500, { form, error: 'Failed to update trade.' });
		}

		return { form };
	},
} satisfies Actions;
