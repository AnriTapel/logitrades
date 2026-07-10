import { writable } from 'svelte/store';
import {
	EMPTY_TRADE_FILTERS,
	hasActiveTradeFilters,
} from '$lib/filters/tradeFilters';
import type { TradeFilters } from '$lib/types';

export const dashboardFiltersStore = writable<TradeFilters>({
	...EMPTY_TRADE_FILTERS,
});

export function resetDashboardFilters(): void {
	dashboardFiltersStore.set({ ...EMPTY_TRADE_FILTERS });
}

export function hasActiveDashboardFilters(filters: TradeFilters): boolean {
	return hasActiveTradeFilters(filters);
}

export function setDashboardFilters(filters: TradeFilters): void {
	dashboardFiltersStore.set(filters);
}

export function setDashboardTags(tags: string[]): void {
	dashboardFiltersStore.update((filters) => ({ ...filters, tags }));
}
