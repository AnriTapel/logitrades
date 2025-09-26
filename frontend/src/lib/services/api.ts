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

export async function importTrades(file: File): Promise<void> {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(`http://localhost:8000/api/v1/trades/import`, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		throw new Error('Failed to import trades');
	}
}
