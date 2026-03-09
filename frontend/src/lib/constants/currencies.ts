/**
 * Most traded currencies from Wikipedia (ISO 4217 codes in table order).
 * Flag URLs from Flagpedia/FlagCDN: https://flagpedia.net/download/api
 * @see https://en.wikipedia.org/wiki/Template:Most_traded_currencies
 */
const FLAG_BASE = 'https://flagcdn.com/w20';

const CURRENCY_TO_COUNTRY: Record<string, string> = {
	USD: 'us',
	EUR: 'eu',
	JPY: 'jp',
	GBP: 'gb',
	CNY: 'cn',
	CHF: 'ch',
	AUD: 'au',
	CAD: 'ca',
	HKD: 'hk',
	SGD: 'sg',
	INR: 'in',
	KRW: 'kr',
	SEK: 'se',
	MXN: 'mx',
	BRL: 'br',
	ILS: 'il',
	AED: 'ae',
	SAR: 'sa',
};

export const CURRENCIES = Object.entries(CURRENCY_TO_COUNTRY).map(
	([code, countryCode]) => ({
		code,
		flagUrl: `${FLAG_BASE}/${countryCode}.webp`,
	}),
);

export type Currency = (typeof CURRENCIES)[number];
export type CurrencyCode = Currency['code'];
