import type TradeForm from '../../routes/trade-form.svelte';

export async function deleteTrade(tradeId: number): Promise<void> {
	const response = await fetch(
		`http://localhost:8000/api/v1/trades/${tradeId}`,
		{
			method: 'DELETE',
		}
	);
	if (!response.ok) {
		throw new Error('Failed to delete trade');
	}
}

export async function updateTrade(
	tradeId: number,
	payload: Partial<TradeForm>
): Promise<void> {
	const response = await fetch(
		`http://localhost:8000/api/v1/trades/${tradeId}`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}
	);
	if (!response.ok) {
		throw new Error('Failed to update trade');
	}
}
