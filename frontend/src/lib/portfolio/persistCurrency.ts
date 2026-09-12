export type PersistCurrencyOptions = {
	currency: string;
	plan: string;
	activePortfolioId?: number | null;
};

export async function persistCurrency({
	currency,
	plan,
	activePortfolioId,
}: PersistCurrencyOptions): Promise<boolean> {
	const formData = new FormData();
	formData.set('currency', currency);
	formData.set('plan', plan);
	if (activePortfolioId != null) {
		formData.set('portfolio_id', String(activePortfolioId));
	}

	const response = await fetch('/?/updateCurrency', {
		method: 'POST',
		body: formData,
	});

	return response.ok;
}
