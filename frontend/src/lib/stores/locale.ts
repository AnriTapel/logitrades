import { writable } from 'svelte/store';

const STORAGE_KEY = 'logitrades-locale';

export type LocaleState = {
	currency: string;
};

const DEFAULT: LocaleState = { currency: 'USD' };

function loadFromStorage(): LocaleState {
	if (typeof window === 'undefined') {
		return DEFAULT;
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return DEFAULT;
		}

		const parsed = JSON.parse(raw);
		if (typeof parsed?.currency === 'string') {
			return { currency: parsed.currency };
		}
	} catch {}
	return DEFAULT;
}

function createLocaleStore() {
	const stored = loadFromStorage();
	const store = writable<LocaleState>(stored);

	store.subscribe((state) => {
		if (typeof window === 'undefined') {
			return;
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	});

	return store;
}

export const localeStore = createLocaleStore();
