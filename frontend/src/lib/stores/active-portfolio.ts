import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Portfolio } from '$lib/types';
import {
	ACTIVE_PORTFOLIO_COOKIE,
	resolvePortfolioIdFromCookie,
} from '$lib/portfolio/resolvePortfolioId';

const STORAGE_KEY = 'lastActivePortfolioId';

function readFromStorage(): number | null {
	if (!browser) return null;
	const raw = localStorage.getItem(STORAGE_KEY);
	const parsed = raw !== null ? parseInt(raw, 10) : NaN;
	return isNaN(parsed) ? null : parsed;
}

function readFromCookie(): string | undefined {
	if (!browser || typeof document === 'undefined') return undefined;
	const match = document.cookie
		.split('; ')
		.find((row) => row.startsWith(`${ACTIVE_PORTFOLIO_COOKIE}=`));
	return match?.split('=').slice(1).join('=');
}

function writeToStorage(id: number | null): void {
	if (!browser) return;
	if (id === null) {
		localStorage.removeItem(STORAGE_KEY);
	} else {
		localStorage.setItem(STORAGE_KEY, String(id));
	}
}

function writeToCookie(id: number | null): void {
	if (!browser) return;
	if (id === null) {
		document.cookie = `${ACTIVE_PORTFOLIO_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
	} else {
		// Not httpOnly — intentionally readable by +page.server.ts
		document.cookie = `${ACTIVE_PORTFOLIO_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax`;
	}
}

export const activePortfolioId = writable<number | null>(null);

export function setActivePortfolioId(id: number): void {
	activePortfolioId.set(id);
	writeToStorage(id);
	writeToCookie(id);
}

export function clearActivePortfolioId(): void {
	activePortfolioId.set(null);
	writeToStorage(null);
	writeToCookie(null);
}

/**
 * Client-side resolve. Prefer cookie (SSR source of truth), then localStorage,
 * then default / first.
 */
export function resolveActivePortfolioId(portfolios: Portfolio[]): number | null {
	if (portfolios.length === 0) return null;

	const cookieRaw = readFromCookie();
	if (cookieRaw) {
		const fromCookie = resolvePortfolioIdFromCookie(cookieRaw, portfolios);
		if (fromCookie != null) return fromCookie;
	}

	const lastActive = readFromStorage();
	if (lastActive !== null && portfolios.some((p) => p.id === lastActive)) {
		return lastActive;
	}

	return resolvePortfolioIdFromCookie(undefined, portfolios) ?? null;
}

/** Seed store from SSR without fighting an already-matching client value. */
export function syncActivePortfolioFromServer(id: number | undefined | null): boolean {
	if (id == null) return false;
	if (get(activePortfolioId) === id) {
		// Ensure cookie/storage stay aligned even if store was set without them
		writeToStorage(id);
		writeToCookie(id);
		return false;
	}
	setActivePortfolioId(id);
	return true;
}
