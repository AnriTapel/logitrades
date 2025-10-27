import { writable } from 'svelte/store';
import type { HttpError } from '$lib/server/http-client/types';

export const errorState = writable<string[] | null>(null);

export function showServerErrors(error: HttpError): void {
	const { details } = error;
	if (Array.isArray(details)) {
		errorState.set(details);
	}
	errorState.set([details as string]);
}

export function clearServerErrors(): void {
	errorState.set(null);
}
