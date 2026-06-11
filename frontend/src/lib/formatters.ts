export const formatIntToCurrency = (
	value: number,
	currency: string,
	maxFractionDigits = 2,
): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: maxFractionDigits,
		trailingZeroDisplay: 'stripIfInteger',
	}).format(value);
};

export const formatNumberPercentage = (
	value: number,
	maxFractionDigits = 2,
): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 0,
		maximumFractionDigits: maxFractionDigits,
	}).format(value);
};

export const formatNumber = (value: number, maxFractionDigits = 2): string => {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: maxFractionDigits,
	}).format(value);
};
