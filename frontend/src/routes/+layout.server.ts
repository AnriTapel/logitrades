import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// User is already authenticated in handle hook (hooks.server.ts)
	// No need to call /auth/me here - it's done once per request in handle
	return {
		isAuthenticated: !!locals.user,
		user: locals.user,
	};
};
