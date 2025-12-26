import { httpClient } from '$lib/server/http-client/http-client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return { status: 'no_token' as const };
	}

	try {
		await httpClient.post('/auth/verify-email', {
			payload: { token },
			fetch
		});
		return { status: 'success' as const };
	} catch (err: unknown) {
		const error = err as { detail?: string } | null;
		const detail = error?.detail || 'Verification failed';
		return {
			status: 'error' as const,
			error: detail
		};
	}
};

