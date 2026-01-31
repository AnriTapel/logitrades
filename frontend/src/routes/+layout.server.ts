import type { LayoutServerLoad } from './$types';
import type { Trade } from '$lib/types';
import { httpClient } from '$lib/server/http-client/http-client';
import { convertApiTradeToUiTrade } from '$lib/tradeConverters';

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

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
	// User is already authenticated in handle hook (hooks.server.ts)
	// No need to call /auth/me here - it's done once per request in handle
	
	let trades: Trade[] = [];
	
	if (locals.user) {
		try {
			const response = await httpClient.get<Trade[]>('/trades', { fetch });
			trades = response?.map(convertApiTradeToUiTrade).sort(sortTradesByClosedAt) ?? [];
		} catch (error) {
			console.error('Error fetching trades:', error);
		}
	}
	
	return {
		isAuthenticated: !!locals.user,
		user: locals.user,
		trades,
	};
};
