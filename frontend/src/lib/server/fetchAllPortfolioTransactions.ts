import { httpClient } from '$lib/server/http-client/http-client';
import type { BalanceTransaction } from '$lib/types';

/** Paginate through portfolio ledger until all rows are loaded (API max page = 200). */
export async function fetchAllPortfolioTransactions(
	fetchFn: typeof fetch,
	portfolioId: number,
): Promise<BalanceTransaction[]> {
	const pageSize = 200;
	let offset = 0;
	let total = Infinity;
	const items: BalanceTransaction[] = [];

	while (offset < total) {
		const params = new URLSearchParams({
			limit: String(pageSize),
			offset: String(offset),
		});
		const page = await httpClient.get<{
			items: BalanceTransaction[];
			total: number;
		}>(`/portfolios/${portfolioId}/transactions`, {
			fetch: fetchFn,
			searchParams: params,
		});
		if (!page) break;
		items.push(...(page.items ?? []));
		total = page.total ?? items.length;
		offset += pageSize;
		if ((page.items?.length ?? 0) === 0) break;
	}

	return items;
}
