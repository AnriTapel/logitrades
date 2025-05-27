import type { Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { formSchema } from './schema';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import type { Trade } from '$lib/types';
import {
	convertApiTradeToUiTrade,
	convertUiTradeFormToApiTrade,
} from '$lib/tradeConverters';

export const load = async () => {
	const loadTrades = async (): Promise<Trade[]> => {
		const BASE_URL = 'http://localhost:8000/api/v1/trades/';
		const response = await fetch(BASE_URL);
		if (!response.ok) {
			throw new Error('Failed to fetch trades');
		}
		const trades = await response.json();
		return trades.map(convertApiTradeToUiTrade);
	};

	const loadForm = async () => await superValidate(zod(formSchema));

	return { trades: await loadTrades(), form: await loadForm() };
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(formSchema));
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
			console.error('Failed to save trade:', response);
			return { error: 'Failed to save trade.' };
		}

		const newTrade = await response.json();
		return { form, trade: newTrade };
	},
} satisfies Actions;
