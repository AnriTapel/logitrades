import { writable } from 'svelte/store';
import {
	EMPTY_TRADE_FILTERS,
	hasActiveTradeFilters,
} from '$lib/filters/tradeFilters';
import type { TradeFilters } from '$lib/types';

export const openedTradeFiltersStore = writable<TradeFilters>({
	...EMPTY_TRADE_FILTERS,
});

export function resetOpenedTradeFilters(): void {
	openedTradeFiltersStore.set({ ...EMPTY_TRADE_FILTERS });
}

export function hasActiveOpenedTradeFilters(filters: TradeFilters): boolean {
	return hasActiveTradeFilters(filters);
}

export function setOpenedTradeFilters(filters: TradeFilters): void {
	openedTradeFiltersStore.set(filters);
}
