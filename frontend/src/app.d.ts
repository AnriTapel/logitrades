// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

export interface User {
	id: number;
	username: string;
	email: string;
	is_active: boolean;
	is_verified: boolean;
}

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
