import type {CoachingHero, HoldTimeSplit, HonorRates, RankedGroup, StreakVsMax, Trade} from '$lib/types';
import {
	calcAbsolutePnl,
	calcAveragePlannedRiskReward,
	calcAverageRealizedR,
	calcBestTrade,
	calcCurrentStreak,
	calcExpectancy,
	calcGrossProfit,
	calcMaxLossStreak,
	calcPayoffRatio,
	calcProfitFactor,
	calcTotalFees,
	calcWinrate,
	pnlForPeriod,
} from '$lib/calcFunctions';
import {WEEKDAY_LABELS} from "$lib/constants/display";

export const COACHING_SAMPLE_MIN = 20;
export const BUCKET_SAMPLE_MIN = 10;
export const GROUP_SAMPLE_MIN = 5;

export function hasEnoughSample(
	n: number,
	min: number = COACHING_SAMPLE_MIN,
): boolean {
	return n >= min;
}

export function calcRequiredWinrate(trades: Trade[]): number | null {
	const planned = calcAveragePlannedRiskReward(trades);
	const r = planned ?? calcPayoffRatio(trades);
	if (r == null || r <= 0) {
		return null;
	}
	return 1 / (1 + r);
}

export function calcPercentWithSl(trades: Trade[]): number {
	if (trades.length === 0) {
		return 0;
	}
	return trades.filter((t) => t.stopLoss != null).length / trades.length;
}

export function buildCoachingHero(trades: Trade[]): CoachingHero {
	const n = trades.length;
	const plannedRR = calcAveragePlannedRiskReward(trades);
	const realizedR = calcAverageRealizedR(trades);
	const requiredWinrate = calcRequiredWinrate(trades);
	const winrate = calcWinrate(trades);
	const slAndTp = trades.filter(
		(t) => t.stopLoss != null && t.takeProfit != null,
	).length;

	return {
		n,
		sampleOk: hasEnoughSample(n),
		expectancy: calcExpectancy(trades),
		expectancyR: realizedR,
		winrate,
		requiredWinrate,
		winrateVsRequired:
			requiredWinrate == null ? null : winrate - requiredWinrate,
		plannedRR,
		realizedR,
		captureGap:
			plannedRR == null || realizedR == null ? null : realizedR - plannedRR,
		percentWithSl: calcPercentWithSl(trades),
		percentWithSlAndTp: n === 0 ? 0 : slAndTp / n,
		profitFactor: calcProfitFactor(trades),
	};
}

function meanDurationMs(trades: Trade[]): number | null {
	if (trades.length === 0) {
		return null;
	}
	const total = trades.reduce((sum, trade) => {
		return (
			sum +
			(new Date(trade.closedAt!).getTime() - new Date(trade.openedAt).getTime())
		);
	}, 0);
	return total / trades.length;
}

export function formatDurationMs(ms: number | null): string {
	if (ms == null) {
		return '—';
	}
	const minutes = ms / (1000 * 60);
	const hours = minutes / 60;
	const days = hours / 24;
	if (days >= 1) {
		return `${days.toFixed(1)}d`;
	}
	if (hours >= 1) {
		return `${hours.toFixed(1)}h`;
	}
	return `${Math.round(minutes)}m`;
}

export function calcHoldTimeSplit(trades: Trade[]): HoldTimeSplit {
	const winners: Trade[] = [];
	const losers: Trade[] = [];
	for (const trade of trades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl == null) continue;
		if (pnl > 0) winners.push(trade);
		else if (pnl < 0) losers.push(trade);
	}
	const winnersMs = meanDurationMs(winners);
	const losersMs = meanDurationMs(losers);
	return {
		winnersMs,
		losersMs,
		hoping: winnersMs != null && losersMs != null && losersMs >= 2 * winnersMs,
	};
}

function closedBeyondStop(trade: Trade): boolean {
	if (trade.stopLoss == null || trade.closePrice == null) {
		return false;
	}
	if (trade.tradeType === 'buy') {
		return trade.closePrice < trade.stopLoss;
	}
	return trade.closePrice > trade.stopLoss;
}

function closedBeforeTakeProfit(trade: Trade): boolean {
	if (trade.takeProfit == null || trade.closePrice == null) {
		return false;
	}
	if (trade.tradeType === 'buy') {
		return trade.closePrice < trade.takeProfit;
	}
	return trade.closePrice > trade.takeProfit;
}

export function calcHonorRates(trades: Trade[]): HonorRates {
	const losersWithSl = trades.filter((trade) => {
		const pnl = calcAbsolutePnl(trade);
		return pnl != null && pnl < 0 && trade.stopLoss != null;
	});
	const winnersWithTp = trades.filter((trade) => {
		const pnl = calcAbsolutePnl(trade);
		return pnl != null && pnl > 0 && trade.takeProfit != null;
	});

	return {
		slHonorRate:
			losersWithSl.length === 0
				? null
				: 1 -
					losersWithSl.filter(closedBeyondStop).length / losersWithSl.length,
		cutWinnerRate:
			winnersWithTp.length === 0
				? null
				: winnersWithTp.filter(closedBeforeTakeProfit).length /
					winnersWithTp.length,
	};
}

export function calcFeeDrag(trades: Trade[]): number | null {
	const gross = calcGrossProfit(trades);
	if (gross <= 0) {
		return null;
	}
	return calcTotalFees(trades) / gross;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return (sorted[mid - 1] + sorted[mid]) / 2;
	}
	return sorted[mid];
}

export function tradeNotional(trade: Trade): number {
	return (trade.openPrice * trade.quantity) / (trade.leverage ?? 1);
}

/** Share of trades whose notional is within ±20% of the median. */
export function calcSizeConsistency(trades: Trade[]): number | null {
	if (trades.length === 0) {
		return null;
	}
	const notionals = trades.map(tradeNotional);
	const med = median(notionals);
	if (med === 0) {
		return null;
	}
	const within = notionals.filter((n) => Math.abs(n - med) <= 0.2 * med).length;
	return within / notionals.length;
}

export function calcStreakVsMax(trades: Trade[]): StreakVsMax {
	const current = calcCurrentStreak(trades);
	const currentLossStreak = current?.type === 'loss' ? current.count : 0;
	const maxLossStreak = calcMaxLossStreak(trades);
	return {
		currentLossStreak,
		maxLossStreak,
		atWorst: currentLossStreak > 0 && currentLossStreak >= maxLossStreak,
	};
}

export function calcConcentration(trades: Trade[]): number | null {
	const best = calcBestTrade(trades);
	const gross = calcGrossProfit(trades);
	if (best == null || best <= 0 || gross <= 0) {
		return null;
	}
	return best / gross;
}

export type BucketStat = {
	label: string;
	n: number;
	meanPnl: number;
	muted: boolean;
};

export function calcWeekdayExpectancy(trades: Trade[]): BucketStat[] {
	const buckets = WEEKDAY_LABELS.map((label) => ({
		label,
		pnls: [] as number[],
	}));

	for (const trade of trades) {
		if (!trade.closedAt) continue;
		const pnl = calcAbsolutePnl(trade);
		if (pnl == null) continue;
		const day = new Date(trade.closedAt).getUTCDay();
		const index = day === 0 ? 6 : day - 1;
		buckets[index].pnls.push(pnl);
	}

	return buckets.map((bucket) => {
		const n = bucket.pnls.length;
		const meanPnl =
			n === 0 ? 0 : bucket.pnls.reduce((sum, v) => sum + v, 0) / n;
		return {
			label: bucket.label,
			n,
			meanPnl,
			muted: n < BUCKET_SAMPLE_MIN,
		};
	});
}

export function calcHourExpectancy(trades: Trade[]): BucketStat[] {
	const buckets = Array.from({ length: 24 }, (_, hour) => ({
		label: `${String(hour).padStart(2, '0')}:00`,
		pnls: [] as number[],
	}));

	for (const trade of trades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl == null) continue;
		const hour = new Date(trade.openedAt).getUTCHours();
		buckets[hour].pnls.push(pnl);
	}

	return buckets.map((bucket) => {
		const n = bucket.pnls.length;
		const meanPnl =
			n === 0 ? 0 : bucket.pnls.reduce((sum, v) => sum + v, 0) / n;
		return {
			label: bucket.label,
			n,
			meanPnl,
			muted: n < BUCKET_SAMPLE_MIN,
		};
	});
}

function rankGroups(
	groups: Map<string, Trade[]>,
	minN: number = GROUP_SAMPLE_MIN,
): RankedGroup[] {
	return Array.from(groups.entries())
		.map(([key, groupTrades]) => ({
			key,
			n: groupTrades.length,
			expectancy: calcExpectancy(groupTrades),
			pnl: pnlForPeriod(groupTrades),
			winrate: calcWinrate(groupTrades),
		}))
		.filter((row) => row.n >= minN)
		.sort((a, b) => b.expectancy - a.expectancy || b.pnl - a.pnl);
}

export function rankTags(trades: Trade[]): RankedGroup[] {
	const groups = new Map<string, Trade[]>();
	for (const trade of trades) {
		if (!trade.tags?.length) continue;
		for (const tag of trade.tags) {
			const existing = groups.get(tag) ?? [];
			existing.push(trade);
			groups.set(tag, existing);
		}
	}
	return rankGroups(groups);
}

export function rankSymbols(trades: Trade[]): RankedGroup[] {
	const groups = new Map<string, Trade[]>();
	for (const trade of trades) {
		const existing = groups.get(trade.symbol) ?? [];
		existing.push(trade);
		groups.set(trade.symbol, existing);
	}
	return rankGroups(groups);
}
