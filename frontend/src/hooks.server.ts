import type { Handle, HandleFetch, Cookies } from '@sveltejs/kit';
import { BACKEND_API_URL } from '$env/static/private';

// Forward cookies to backend for cross-origin requests
export const handleFetch: HandleFetch = async ({ fetch, request, event }) => {
	if (request.url.startsWith(BACKEND_API_URL)) {
		const cookies = event.request.headers.get('cookie');
		if (cookies) {
			request.headers.set('cookie', cookies);
		}
	}
	return fetch(request);
};

// Helper to parse Set-Cookie header
function parseCookie(
	cookieStr: string
): [string, string, Parameters<Cookies['set']>[2]] {
	const parts = cookieStr.split(';').map((p) => p.trim());
	const [nameValue, ...attrs] = parts;
	const [name, value] = nameValue.split('=');

	const options: Parameters<Cookies['set']>[2] = { path: '/' };
	for (const attr of attrs) {
		const [aNameRaw, aValRaw] = attr.split('=');
		const aName = aNameRaw?.toLowerCase();
		if (aName === 'path') options.path = aValRaw || '/';
		if (aName === 'max-age' && aValRaw) options.maxAge = Number(aValRaw);
		if (aName === 'samesite')
			options.sameSite = (aValRaw as 'lax' | 'strict' | 'none') ?? 'lax';
		if (aName === 'secure') options.secure = true;
		if (aName === 'httponly') options.httpOnly = true;
	}

	return [name, value ?? '', options];
}

// Authenticate user BEFORE any load functions run
export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth for login/signup pages
	const publicPaths = ['/login', '/signup'];
	if (publicPaths.some((path) => event.url.pathname.startsWith(path))) {
		event.locals.user = null;
		return resolve(event);
	}

	// Call /auth/me to validate tokens and get user
	try {
		const res = await event.fetch(`${BACKEND_API_URL}/api/v1/auth/me`, {
			credentials: 'include',
		});

		if (res.ok) {
			const user = await res.json();
			event.locals.user = user;

			// Forward any Set-Cookie headers from /auth/me (token refresh)
			const setCookies = res.headers.getSetCookie?.() ?? [];
			for (const cookie of setCookies) {
				const [name, value, options] = parseCookie(cookie);
				event.cookies.set(name, value, options);
			}
		} else {
			event.locals.user = null;
		}
	} catch {
		event.locals.user = null;
	}

	return resolve(event);
};
