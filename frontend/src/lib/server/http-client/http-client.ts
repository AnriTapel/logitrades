import { BACKEND_API_URL } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';
import { forwardCookies } from './cookie-utils';

type ResponseType<T = null> = T | null | void;

type HttpRequestOptions<T = undefined> = {
	disableErrorModal?: boolean;
	payload?: T;
	headers?: HeadersInit;
	fetch?: typeof fetch; // Optional fetch function for server-side cookie forwarding
	credentials?: RequestCredentials;
};

type AuthRequestResult<T = unknown> =
	| { success: true; data: T }
	| { success: false; status: number; error: unknown };

export class HttpClient {
	private readonly baseUrl: string;
	private readonly customFetch?: typeof fetch;

	constructor(customFetch?: typeof fetch) {
		this.baseUrl = BACKEND_API_URL;
		this.customFetch = customFetch;
	}

	public async get<K>(
		url: string,
		options?: HttpRequestOptions
	): Promise<ResponseType<K>> {
		return this.request<undefined, K>(url, 'GET', options);
	}

	public async post<T, K = null>(
		url: string,
		options: HttpRequestOptions<T>
	): Promise<ResponseType<K>> {
		return this.request<T, K>(url, 'POST', options);
	}

	public async put<T, K = null>(
		url: string,
		options?: HttpRequestOptions<T>
	): Promise<ResponseType<K>> {
		return this.request<T, K>(url, 'PUT', options);
	}

	public async delete<K>(
		url: string,
		options?: HttpRequestOptions
	): Promise<ResponseType<K>> {
		return this.request<undefined, K>(url, 'DELETE', options);
	}

	public async sendFile(
		url: string,
		file: File,
		options: HttpRequestOptions = {}
	): Promise<ResponseType> {
		const formData = new FormData();
		formData.append('file', file);

		const fetchFn = options.fetch || this.customFetch || fetch;
		const response = await fetchFn(this.buildRequestUrl(url), {
			method: 'POST',
			body: formData,
			credentials: 'include',
		});

		if (!response.ok) {
			throw await response.json().catch(() => null);
		}
	}

	/**
	 * Make an auth request that forwards Set-Cookie headers to the browser.
	 * Used for login/signup endpoints that need to set httpOnly cookies.
	 */
	public async authRequest<T = unknown>(
		url: string,
		payload: Record<string, unknown>,
		fetchFn: typeof fetch,
		cookies: Cookies
	): Promise<AuthRequestResult<T>> {
		const res = await fetchFn(this.buildRequestUrl(url), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
			credentials: 'include',
		});

		if (!res.ok) {
			const error = await res
				.json()
				.catch(() => ({ detail: 'Request failed' }));
			return { success: false, status: res.status, error };
		}

		// Forward Set-Cookie headers from backend to browser
		forwardCookies(res, cookies);

		const data = (await res.json().catch(() => null)) as T;
		return { success: true, data };
	}

	private buildRequestUrl(pathname: string): string {
		const urlStr = `${this.baseUrl}/api/v1${pathname}`;
		const url = new URL(urlStr);

		return url.toString();
	}

	private async request<T, K = null>(
		url: string,
		method: string,
		options: HttpRequestOptions<T> = {}
	): Promise<ResponseType<K>> {
		const { payload, headers = {} } = options;
		const fetchFn = options.fetch || this.customFetch || fetch;
		const response = await fetchFn(this.buildRequestUrl(url), {
			method,
			headers: { 'Content-Type': 'application/json', ...headers },
			body: payload ? JSON.stringify(payload) : undefined,
			credentials: 'include',
		});

		if (!response.ok) {
			throw await response.json().catch(() => null);
		}

		const data = await response.json().catch(() => null);

		return data as K;
	}
}

export const httpClient = new HttpClient();
