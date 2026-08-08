import {
	endOfMonth,
	now,
	parseAbsolute,
	startOfMonth,
	getWeeksInMonth,
	getDayOfWeek,
	type ZonedDateTime,
} from '@internationalized/date';
import type { CalendarHeatmapItemData, ItemOption, Trade } from '$lib/types';
import {
	formatDateDisplay,
	formatPortfolioDateLocal,
	localTimezone,
	toUtcIso,
	userLocale,
} from '$lib/dates';
import { calcAbsolutePnl } from '$lib/calcFunctions';

const getHeatmapMonthKey = (date: ZonedDateTime): string =>
	`${date.year}-${String(date.month).padStart(2, '0')}`;

export const getHeatmapMonthsOptions = (monthsToShow: number): ItemOption[] => {
	const pivotDate = now(localTimezone);

	const options: ItemOption[] = [];

	for (let i = 0; i < monthsToShow; i++) {
		const prevDate = pivotDate.subtract({ months: i });

		const key = getHeatmapMonthKey(prevDate);
		options.unshift({
			key,
			label: formatDateDisplay(prevDate.toAbsoluteString()),
		});
	}

	return options;
};

const getTradesByMonth = (trades: Trade[], monthKey: string): Trade[] => {
	const pivotDate = parseAbsolute(toUtcIso(new Date(monthKey)), localTimezone);
	const startDate = startOfMonth(pivotDate).set({
		hour: 0,
		minute: 0,
		second: 0,
	});
	const endDate = endOfMonth(pivotDate).set({
		hour: 23,
		minute: 59,
		second: 59,
	});

	return trades.filter((trade) => {
		if (!trade.closedAt) {
			return false;
		}

		const closedAtDate = parseAbsolute(trade.closedAt, localTimezone);
		return closedAtDate >= startDate && closedAtDate <= endDate;
	});
};

export const getHeatmapDataMapPerDate = (
	trades: Trade[],
	monthKey: string,
): Map<string, Trade[]> => {
	const dataMap = new Map<string, Trade[]>();

	const filteredTrades = getTradesByMonth(trades, monthKey);

	for (let trade of filteredTrades) {
		if (!trade.closedAt) {
			continue;
		}

		const key = formatPortfolioDateLocal(trade.closedAt);
		dataMap.set(key, [...(dataMap.get(key) ?? []), trade]);
	}

	return dataMap;
};

/** ICU weekday: 1 = Monday … 7 = Sunday → JS Date day (0 = Sunday … 6 = Saturday). */
const icuFirstDayToJsDay = (firstDay: number): number =>
	firstDay === 7 ? 0 : firstDay;

/** Seven short weekday labels ordered by the locale's first day of week. */
export const getWeekdayLabels = (
	locale: Intl.Locale = userLocale,
): string[] => {
	const jsFirstDay = icuFirstDayToJsDay(locale.getWeekInfo().firstDay);
	const formatter = new Intl.DateTimeFormat(locale.baseName, {
		weekday: 'short',
	});
	// 2024-01-07 is a Sunday (JS day 0).
	const sundayAnchor = new Date(2024, 0, 7);

	return Array.from({ length: 7 }, (_, columnIndex) => {
		const jsDay = (jsFirstDay + columnIndex) % 7;
		const date = new Date(sundayAnchor);
		date.setDate(sundayAnchor.getDate() + jsDay);
		return formatter.format(date);
	});
};

/**
 * Builds a weeks × 7 matrix for the given month.
 * Leading/trailing cells outside the month are `null`.
 * In-month cells include daily PnL and trade count from `tradesPerDayMap`.
 *
 * `getDayOfWeek` is locale-aware (0 = first weekday for that locale),
 * so Sunday-start and Monday-start calendars both align correctly.
 */
export const getDaysMatrix = (
	monthKey: string,
	tradesPerDayMap: Map<string, Trade[]>,
	locale: Intl.Locale = userLocale,
	timezone: string = localTimezone,
): ReadonlyArray<Array<CalendarHeatmapItemData>> => {
	const pivotDate = parseAbsolute(toUtcIso(new Date(monthKey)), timezone);
	const weeksInMonth = getWeeksInMonth(pivotDate, locale.baseName);

	const matrix = Array.from({ length: weeksInMonth }, () =>
		Array.from({ length: 7 }, (): CalendarHeatmapItemData => null),
	);

	const monthStart = startOfMonth(pivotDate).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
	});
	const daysInMonth = endOfMonth(pivotDate).day;
	const weekdayOfFirstDay = getDayOfWeek(monthStart, locale.baseName);

	for (let weekIndex = 0; weekIndex < matrix.length; weekIndex++) {
		for (let dayOfWeekIndex = 0; dayOfWeekIndex < 7; dayOfWeekIndex++) {
			const dayNumber =
				weekIndex * 7 + dayOfWeekIndex - weekdayOfFirstDay + 1;

			// Trailing/leading days of adjacent months stay null.
			if (dayNumber < 1 || dayNumber > daysInMonth) {
				continue;
			}

			const dayDate = monthStart.set({ day: dayNumber });
			const dateKey = formatPortfolioDateLocal(dayDate.toAbsoluteString());
			const dayTrades = tradesPerDayMap.get(dateKey) ?? [];

			matrix[weekIndex][dayOfWeekIndex] = {
				date: dateKey,
				pnl: dayTrades.reduce(
					(sum, trade) => sum + (calcAbsolutePnl(trade) ?? 0),
					0,
				),
				tradesCount: dayTrades.length,
			};
		}
	}

	return matrix;
};
