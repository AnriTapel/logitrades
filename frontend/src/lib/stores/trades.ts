import { writable } from 'svelte/store';
import type { Trade } from '$lib/types';

/**
 * Trades are stored in descending order by closedAt date (most recent first).
 * Open trades have closedAt as null and are sorted to the end of the list.
 */
export const tradesStore = writable<Trade[]>([]);
