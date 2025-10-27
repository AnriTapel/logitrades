import { BACKEND_API_URL } from '$env/static/private';

type ResponseType<T = null> = T | null | void;

type HttpRequestOptions<T = undefined> = {
	disableErrorModal?: boolean;
	payload?: T;
	headers?: HeadersInit;
};

export class HttpClient {
	private readonly baseUrl: string;

	constructor() {
		this.baseUrl = BACKEND_API_URL;
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

		const response = await fetch(this.buildRequestUrl(url), {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			throw await response.json().catch(() => null);
		}
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
		const response = await fetch(this.buildRequestUrl(url), {
			method,
			headers: { 'Content-Type': 'application/json', ...headers },
			body: payload ? JSON.stringify(payload) : undefined,
		});

		if (!response.ok) {
			throw await response.json().catch(() => null);
		}

		const data = await response.json().catch(() => null);

		return data as K;
	}
}

export const httpClient = new HttpClient();
