import type { PageLoad } from './$types';

export const load = (async ({ fetch }) => {
	const BASE_URL = 'http://localhost:8000/api/v1/trades/';
	const response = await fetch(BASE_URL);
	if (!response.ok) {
		throw new Error('Failed to fetch trades');
	}
	const trades = await response.json();
	return { trades };
}) satisfies PageLoad;
