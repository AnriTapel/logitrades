import type { LayoutServerLoad } from './$types';
import { compareUtcIso } from '$lib/dates';
import type { Trade } from '$lib/types';
import { httpClient } from '$lib/server/http-client/http-client';
import { convertApiTradeToUiTrade } from '$lib/tradeConverters';

const sortTradesByClosedAt = (a: Trade, b: Trade): number => {
	if (a.closedAt && b.closedAt) {
		return compareUtcIso(b.closedAt, a.closedAt);
	}
	if (a.closedAt && !b.closedAt) return 1;
	if (b.closedAt && !a.closedAt) return -1;
	return compareUtcIso(b.openedAt, a.openedAt);
};

export const load: LayoutServerLoad = async ({ locals, fetch, url }) => {
	let trades: Trade[] = [];

	if (locals.user) {
		try {
			const response = await httpClient.get<Trade[]>('/trades', { fetch });
			trades =
				response?.map(convertApiTradeToUiTrade).sort(sortTradesByClosedAt) ??
				[];
		} catch (error) {
			console.error('Error fetching trades:', error);
		}
	}

	return {
		isAuthenticated: !!locals.user,
		user: locals.user,
		trades,
		showAppChrome: url.pathname !== '/',
	};
};
