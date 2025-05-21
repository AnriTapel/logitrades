import type { Actions } from './$types';

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();

		const symbol = formData.get('symbol')?.toString().toUpperCase();
		const type = formData.get('type');
		const price = formData.get('price');
		const quantity = formData.get('quantity');
		const stopLoss = formData.get('stop_loss');
		const takeProfit = formData.get('take_profit');
		const use_leverage = formData.get('use_leverage');
		const leverage = formData.get('leverage');
		const comment = formData.get('comment');

		const trade = {
			symbol,
			type,
			price: price ? Number(price) : null,
			quantity: quantity ? Number(quantity) : null,
			stop_loss: stopLoss ? Number(stopLoss) : null,
			take_profit: takeProfit ? Number(takeProfit) : null,
			leverage: use_leverage ? Number(leverage) : null,
			comment: comment ? comment.toString() : null,
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
		return { success: true, trade: newTrade };
	},
} satisfies Actions;
