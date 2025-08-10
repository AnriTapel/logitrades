import { writable } from 'svelte/store';
import type { Trade } from '$lib/types';

export const tradesStore = writable<Trade[]>([]);
