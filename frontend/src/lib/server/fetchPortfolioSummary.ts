import { httpClient } from '$lib/server/http-client/http-client';
import type { PortfolioSummary } from '$lib/types';

export async function fetchPortfolioSummary(
	fetch: typeof globalThis.fetch,
	portfolioId: number,
): Promise<PortfolioSummary> {
	return await httpClient.get<PortfolioSummary>(
		`/portfolios/${portfolioId}/summary`,
		{ fetch },
	);
}
