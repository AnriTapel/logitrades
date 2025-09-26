import { writable } from 'svelte/store';

export const errorState = writable<string[] | null>(null);

export function showServerErrors(messages: string[]): void {
	errorState.set(messages);
}

export function clearServerErrors(): void {
	errorState.set(null);
}
