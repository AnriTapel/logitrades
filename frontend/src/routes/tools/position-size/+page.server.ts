import type { PageServerLoad } from './$types';
import { fetchPortfolioSummary } from '$lib/server/fetchPortfolioSummary';
import { effectiveCurrency } from '$lib/portfolio/effectiveCurrency';

export const load: PageServerLoad = async ({ parent, fetch }) => {
	const { user, portfolios, activePortfolioId } = await parent();

	const plan = user?.plan ?? 'free';
	const activePortfolio =
		portfolios?.find((portfolio) => portfolio.id === activePortfolioId) ?? null;

	const portfolioSummary =
		(plan === 'pro' || plan === 'max') && activePortfolioId != null
			? await fetchPortfolioSummary(fetch, activePortfolioId)
			: null;

	const displayCurrency = effectiveCurrency({
		userCurrency: user?.currency,
		activePortfolio,
	});

	return {
		initialBalance: portfolioSummary?.equity ?? null,
		displayCurrency,
	};
};
