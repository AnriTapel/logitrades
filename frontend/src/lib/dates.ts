/** Branded UTC ISO 8601 string, e.g. "2024-06-11T09:30:00.000Z" */
export type UtcIsoDateTime = string;

/** Normalise any ISO date string or Date object to a UTC ISO string. */
export function toUtcIso(value: Date | string): UtcIsoDateTime {
	const d = typeof value === 'string' ? new Date(value) : value;
	return d.toISOString();
}

/** Human-readable local datetime for display (no timezone label). */
export function formatTradeDateTimeLocal(iso: UtcIsoDateTime): string {
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(iso));
}

/** Short date-only label for calendar picker button. */
export function formatTradeDateLocal(iso: UtcIsoDateTime): string {
	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'short',
	}).format(new Date(iso));
}

/** For sort comparators. Negative = a before b. */
export function compareUtcIso(a: UtcIsoDateTime, b: UtcIsoDateTime): number {
	return a.localeCompare(b);
}

/** YYYY-MM-DD → UTC start of day ISO string. */
export function toUtcStartOfDay(dateStr: string): UtcIsoDateTime {
	return `${dateStr}T00:00:00.000Z`;
}

/** YYYY-MM-DD → UTC end of day ISO string. */
export function toUtcEndOfDay(dateStr: string): UtcIsoDateTime {
	return `${dateStr}T23:59:59.999Z`;
}
