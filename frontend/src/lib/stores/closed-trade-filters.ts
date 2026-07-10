import { writable } from 'svelte/store';
import {
	EMPTY_TRADE_FILTERS,
	hasActiveTradeFilters,
} from '$lib/filters/tradeFilters';
import type { TradeFilters } from '$lib/types';

export const closedTradeFiltersStore = writable<TradeFilters>({
	...EMPTY_TRADE_FILTERS,
});

export function resetClosedTradeFilters(): void {
	closedTradeFiltersStore.set({ ...EMPTY_TRADE_FILTERS });
}

export function hasActiveClosedTradeFilters(filters: TradeFilters): boolean {
	return hasActiveTradeFilters(filters);
}

export function setClosedTradeFilters(filters: TradeFilters): void {
	closedTradeFiltersStore.set(filters);
}
