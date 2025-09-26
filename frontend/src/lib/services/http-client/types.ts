export type HttpClientError<T = unknown> = {
	detail: Array<{
		type: string;
		msg: string;
		input?: T;
	}>;
};
