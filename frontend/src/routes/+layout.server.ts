import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	return {
		isAuthenticated: !!locals.user,
		user: locals.user,
		showAppChrome: url.pathname !== '/',
	};
};
