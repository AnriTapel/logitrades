import { writable } from 'svelte/store';
import { DEFAULT_CURRENCY } from '$lib/constants/currencies';

export type LocaleState = {
	currency: string;
};

const DEFAULT: LocaleState = { currency: DEFAULT_CURRENCY };

/** In-memory only — seeded from backend on layout load / currency change. */
export const localeStore = writable<LocaleState>({ ...DEFAULT });

export function setLocaleCurrency(currency: string): void {
	localeStore.set({ currency });
}
