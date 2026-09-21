import { describe, it, expect } from 'vitest';
import type { Trade } from '$lib/types';
import {
	buildCoachingHero,
	calcRequiredWinrate,
	calcHoldTimeSplit,
	calcHonorRates,
	calcFeeDrag,
	calcSizeConsistency,
	calcConcentration,
	calcStreakVsMax,
	calcWeekdayExpectancy,
	rankTags,
	COACHING_SAMPLE_MIN,
} from '$lib/coachingCalcs';

let _id = 0;

function closed(params: {
	tradeType?: 'buy' | 'sell';
	openPrice?: number;
	quantity?: number;
	closePrice: number;
	closedAt?: string;
	openedAt?: string;
	stopLoss?: number;
	takeProfit?: number;
	fee?: number;
	symbol?: string;
	tags?: string[];
}): Trade {
	return {
		id: ++_id,
		symbol: params.symbol ?? 'TEST',
		tradeType: params.tradeType ?? 'buy',
		openPrice: params.openPrice ?? 100,
		quantity: params.quantity ?? 1,
		closePrice: params.closePrice,
		closedAt: params.closedAt ?? '2024-01-02T10:00:00Z',
		openedAt: params.openedAt ?? '2024-01-01T10:00:00Z',
		createdAt: '2024-01-01T10:00:00Z',
		...(params.stopLoss !== undefined && { stopLoss: params.stopLoss }),
		...(params.takeProfit !== undefined && { takeProfit: params.takeProfit }),
		...(params.fee !== undefined && { fee: params.fee }),
		...(params.tags !== undefined && { tags: params.tags }),
	};
}

const fixtureA = [
	closed({
		closePrice: 110,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-01T16:00:00Z',
	}),
	closed({
		closePrice: 92,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-02T16:00:00Z',
	}),
	closed({
		closePrice: 106,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-03T16:00:00Z',
	}),
	closed({
		closePrice: 91,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-04T16:00:00Z',
	}),
];

describe('coaching hero — fixture A', () => {
	it('required WR is 1/3; 50% actual is above plan; capture misses 2R', () => {
		expect(calcRequiredWinrate(fixtureA)).toBeCloseTo(1 / 3);

		const hero = buildCoachingHero(fixtureA);
		expect(hero.n).toBe(4);
		expect(hero.sampleOk).toBe(false);
		expect(hero.n < COACHING_SAMPLE_MIN).toBe(true);
		expect(hero.winrate).toBe(0.5);
		expect(hero.winrateVsRequired).toBeCloseTo(0.5 - 1 / 3);
		expect(hero.plannedRR).toBeCloseTo(2);
		expect(hero.realizedR).toBeCloseTo(-0.05);
		expect(hero.captureGap).toBeCloseTo(-2.05);
		expect(hero.percentWithSl).toBe(1);
		expect(hero.profitFactor).toBeCloseTo(16 / 17);
	});

	it('skips required WR when there is no planned R:R or payoff', () => {
		expect(
			calcRequiredWinrate([
				closed({ closePrice: 110 }),
				closed({ closePrice: 110 }),
			]),
		).toBeNull();
	});
});

describe('process leaks', () => {
	const processFixture = [
		closed({
			closePrice: 110,
			stopLoss: 95,
			takeProfit: 110,
			fee: 1,
			openedAt: '2024-01-01T10:00:00Z',
			closedAt: '2024-01-01T11:00:00Z',
		}),
		closed({
			closePrice: 110,
			stopLoss: 95,
			takeProfit: 110,
			fee: 1,
			openedAt: '2024-01-02T10:00:00Z',
			closedAt: '2024-01-02T12:00:00Z',
		}),
		closed({
			closePrice: 90,
			stopLoss: 95,
			takeProfit: 110,
			fee: 1,
			openedAt: '2024-01-03T10:00:00Z',
			closedAt: '2024-01-03T16:00:00Z',
		}),
	];

	it('hold time: losers held 6h vs winners 1.5h (hoping)', () => {
		const split = calcHoldTimeSplit(processFixture);
		expect(split.winnersMs).toBe(1.5 * 60 * 60 * 1000);
		expect(split.losersMs).toBe(6 * 60 * 60 * 1000);
		expect(split.hoping).toBe(true);
	});

	it('loser closed past SL is not honored; winners at TP are not cut', () => {
		const honor = calcHonorRates(processFixture);
		expect(honor.slHonorRate).toBe(0);
		expect(honor.cutWinnerRate).toBe(0);
	});

	it('fee drag = 3 / 18 (fees / net gross profit)', () => {
		expect(calcFeeDrag(processFixture)).toBeCloseTo(3 / 18);
	});

	it('size consistency is 1 when all notionals match', () => {
		expect(calcSizeConsistency(processFixture)).toBe(1);
	});

	it('concentration = best win / gross = 9/18', () => {
		expect(calcConcentration(processFixture)).toBeCloseTo(0.5);
	});

	it('loss streak vs max: current 1, max 1, at worst', () => {
		const streak = calcStreakVsMax(processFixture);
		expect(streak.currentLossStreak).toBe(1);
		expect(streak.maxLossStreak).toBe(1);
		expect(streak.atWorst).toBe(true);
	});
});

describe('weekday expectancy uses mean and n, not sum', () => {
	it('two +10 trades on Monday → mean 10, n=2, muted', () => {
		const trades = [
			closed({ closePrice: 110, closedAt: '2024-01-01T16:00:00Z' }),
			closed({ closePrice: 110, closedAt: '2024-01-08T16:00:00Z' }),
		];
		const monday = calcWeekdayExpectancy(trades)[0];
		expect(monday.label).toBe('Mon');
		expect(monday.n).toBe(2);
		expect(monday.meanPnl).toBe(10);
		expect(monday.muted).toBe(true);
	});
});

describe('tag ranking', () => {
	it('sorts by expectancy and includes PnL', () => {
		const trades: Trade[] = [];
		for (let i = 0; i < 5; i++) {
			trades.push(closed({ closePrice: 110, tags: ['A-setup'] }));
		}
		for (let i = 0; i < 5; i++) {
			trades.push(closed({ closePrice: 90, tags: ['FOMO'] }));
		}
		const ranked = rankTags(trades);
		expect(ranked.map((row) => row.key)).toEqual(['A-setup', 'FOMO']);
		expect(ranked[0]?.n).toBe(5);
		expect(ranked[0]?.expectancy).toBe(10);
		expect(ranked[0]?.pnl).toBe(50);
		expect(ranked[1]?.expectancy).toBe(-10);
		expect(ranked[1]?.pnl).toBe(-50);
	});
});
