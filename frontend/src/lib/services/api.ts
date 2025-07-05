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
