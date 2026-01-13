export const formatISOToDateTimeStr = (dateStr: string): string => {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

export const formatIntToCurrency = (
	value: number,
	maxFractionDigits = 2
): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: maxFractionDigits,
		trailingZeroDisplay: 'stripIfInteger',
	}).format(value);
};

export const formatNumberPercentage = (
	value: number,
	maxFractionDigits = 2
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

export const formatDateTimeISO = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toISOString();
};
