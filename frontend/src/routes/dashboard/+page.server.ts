import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent }) => {
	const { isAuthenticated } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	return { isAuthenticated };
}) satisfies PageServerLoad;
