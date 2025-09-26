import type { HttpClientError } from './types';

type ResponseType<T = null> = T | null | void;

type HttpRequestOptions<T = undefined> = {
	disableErrorModal?: boolean;
	payload?: T;
};

export class HttpClient {
	public async get<K>(
		url: string,
		options: HttpRequestOptions
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
		options: HttpRequestOptions<T>
	): Promise<ResponseType<K>> {
		return this.request<T, K>(url, 'PUT', options);
	}

	public async delete<K>(
		url: string,
		options: HttpRequestOptions
	): Promise<ResponseType<K>> {
		return this.request<undefined, K>(url, 'DELETE', options);
	}

	private async request<T, K = null>(
		url: string,
		method: string,
		options: HttpRequestOptions<T>
	): Promise<ResponseType<K>> {
		const { payload, disableErrorModal } = options;
		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: payload ? JSON.stringify(payload) : undefined,
			});

			if (!response.ok) {
				const error = await response.json().catch(() => null);
				throw error;
			}

			const data = await response.json().catch(() => null);

			return data as K;
		} catch (e: unknown) {
			const { detail } = e as HttpClientError;

			if (disableErrorModal) {
				throw e;
			}
			const msg = detail?.map((it) => it.msg) ?? ['Something went wrong'];
			throw msg;
		}
	}
}

export const httpClient: HttpClient = new HttpClient();
