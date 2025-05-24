import type { Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { formSchema } from './schema';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const loadTrades = async () => {
		const BASE_URL = 'http://localhost:8000/api/v1/trades/';
		const response = await fetch(BASE_URL);
		if (!response.ok) {
			throw new Error('Failed to fetch trades');
		}
		const trades = await response.json();
		return trades;
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
		const data = form.data;

		const trade = {
			symbol: data.symbol.toUpperCase(),
			type: data.tradeType,
			price: Number(data.price),
			quantity: Number(data.quantity),
			stop_loss: data.stopLoss ? Number(data.stopLoss) : null,
			take_profit: data.takeProfit ? Number(data.takeProfit) : null,
			leverage: data.useLeverage ? Number(data.leverage) : null,
			comment: data.comment ? data.comment.toString() : null,
		};

		const response = await fetch('http://localhost:8000/api/v1/trades/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(trade),
		});

		if (!response.ok) {
			console.error('Failed to save trade:', response);
			return { error: 'Failed to save trade.' };
		}

		const newTrade = await response.json();
		return { form, trade: newTrade };
	},
} satisfies Actions;
