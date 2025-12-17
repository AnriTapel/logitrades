import { writable } from 'svelte/store';
import type { User } from '../../app.d.ts';

// Re-export User type for convenience
export type { User };

export const isAuthenticated = writable<boolean>(false);
export const user = writable<User | null>(null);

// Helper function to clear auth state
export function clearAuth() {
	isAuthenticated.set(false);
	user.set(null);
}

// Helper function to set auth state
export function setAuth(userData: User) {
	isAuthenticated.set(true);
	user.set(userData);
}
