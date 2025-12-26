import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { httpClient } from '$lib/server/http-client/http-client';

export const actions = {
	resend: async ({ fetch }) => {
		try {
			await httpClient.post('/auth/resend-verification', { fetch });
			return { success: true };
		} catch (err: unknown) {
			const error = err as { detail?: string } | null;
			return fail(400, { error: error?.detail || 'Failed to resend verification email' });
		}
	}
} satisfies Actions;

