import { writable } from 'svelte/store';
import type { User } from '../../app.d.ts';

// Re-export User type for convenience
export type { User };

export const isAuthenticated = writable<boolean>(false);
export const userStore = writable<User | null>(null);

// Helper function to clear auth state
export function clearAuth() {
	isAuthenticated.set(false);
	userStore.set(null);
}

// Helper function to set auth state
export function setAuth(userData: User) {
	isAuthenticated.set(true);
	userStore.set(userData);
}
