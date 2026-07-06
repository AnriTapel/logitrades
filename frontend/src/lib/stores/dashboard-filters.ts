import { writable } from 'svelte/store';
import type { Trade } from '$lib/types';
import type { UtcIsoDateTime } from '$lib/dates';

/** Extensible filter shape — add fields as Pro/Max filters ship */
export type DashboardDateRange = {
	from?: UtcIsoDateTime;
	to?: UtcIsoDateTime;
};

export type DashboardFilters = {
	tags: string[];
	symbols: string[];
	dateRange: DashboardDateRange | null;
};

const DEFAULT_FILTERS: DashboardFilters = {
	tags: [],
	symbols: [],
	dateRange: null,
};

export const dashboardFiltersStore = writable<DashboardFilters>({
	...DEFAULT_FILTERS,
});

export function resetDashboardFilters(): void {
	dashboardFiltersStore.set({ ...DEFAULT_FILTERS });
}

export function hasActiveDashboardFilters(filters: DashboardFilters): boolean {
	return (
		filters.tags.length > 0 ||
		filters.symbols.length > 0 ||
		filters.dateRange !== null
	);
}

export function setDashboardTags(tags: string[]): void {
	dashboardFiltersStore.update((filters) => ({ ...filters, tags }));
}

type TradePredicate = (trade: Trade) => boolean;

function byTags(tags: string[]): TradePredicate {
	if (!tags.length) return () => true;
	return (trade) => trade.tags?.some((tag) => tags.includes(tag)) ?? false;
}

function bySymbols(_symbols: string[]): TradePredicate {
	return () => true;
}

function byDateRange(_range: DashboardDateRange | null): TradePredicate {
	return () => true;
}

/** AND-combine all active predicates */
export function applyDashboardFilters(
	trades: Trade[],
	filters: DashboardFilters,
): Trade[] {
	const predicates: TradePredicate[] = [
		byTags(filters.tags),
		bySymbols(filters.symbols),
		byDateRange(filters.dateRange),
	];
	return trades.filter((trade) => predicates.every((predicate) => predicate(trade)));
}
