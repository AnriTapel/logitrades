import type { Cookies } from '@sveltejs/kit';

/**
 * Parse Set-Cookie headers from a Response and set them on SvelteKit cookies.
 * Used for forwarding auth cookies from backend to browser.
 */
export function forwardCookies(response: Response, cookies: Cookies): void {
	const setCookies = response.headers.getSetCookie?.() ?? [];

	for (const cookieStr of setCookies) {
		const parts = cookieStr.split(';').map((p) => p.trim());
		const [nameValue, ...attrs] = parts;
		const [name, value] = nameValue.split('=');
		if (!name) continue;

		const options: Parameters<typeof cookies.set>[2] = { path: '/' };
		for (const attr of attrs) {
			const [aNameRaw, aValRaw] = attr.split('=');
			const aName = aNameRaw?.toLowerCase();
			const aVal = aValRaw?.toLowerCase();
			if (aName === 'path') options.path = aValRaw || '/';
			if (aName === 'max-age' && aVal) options.maxAge = Number(aVal);
			if (aName === 'samesite') options.sameSite = (aValRaw as 'lax' | 'strict' | 'none') ?? 'lax';
			if (aName === 'secure') options.secure = true;
			if (aName === 'httponly') options.httpOnly = true;
		}
		cookies.set(name, value ?? '', options);
	}
}

