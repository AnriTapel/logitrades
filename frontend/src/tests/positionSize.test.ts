/**
 * Position sizing calculator — first-principles tests.
 *
 * Pipeline:
 *   riskAmount = balance × (risk% / 100) | absolute risk
 *   priceDistance = |entry − stopLoss|
 *   positionSize = riskAmount / (priceDistance × contractSize) [round down to step]
 *   notionalValue = positionSize × entry × contractSize
 *   requiredMargin = notionalValue / leverage
 *   actualRiskAmount = positionSize × priceDistance × contractSize
 *   stopLossPercent = (priceDistance / entry) × 100
 *
 * Rule B: priceDistance / entry >= 1 / leverage → liquidation before SL
 * Rule A: requiredMargin > accountBalance → insufficient margin
 */

import { describe, it, expect } from 'vitest';
import {
	calculatePositionSize,
	PositionSizeValidationError,
	type PositionSizeInput,
} from '$lib/position-size';

const baseInput: PositionSizeInput = {
	accountBalance: 10_000,
	riskMode: 'PERCENTAGE',
	riskValue: 2,
	entryPrice: 100,
	stopLossPrice: 95,
	leverage: 1,
	contractSize: 1,
	sizeStep: 'exact',
};

describe('calculatePositionSize', () => {
	it('percentage risk: sizes position from balance and stop distance', () => {
		const result = calculatePositionSize(baseInput);

		expect(result.isValid).toBe(true);
		expect(result.validationError).toBeNull();
		// riskAmount = 10000 × 0.02 = 200
		// priceDistance = 5 → positionSize = 200 / 5 = 40
		expect(result.positionSize).toBe(40);
		expect(result.notionalValue).toBe(4_000);
		expect(result.requiredMargin).toBe(4_000);
		expect(result.actualRiskAmount).toBe(200);
		expect(result.stopLossPercent).toBe(5);
		expect(result.journalQuantity).toBe(40);
	});

	it('absolute risk: uses riskValue directly as dollar risk', () => {
		const result = calculatePositionSize({
			...baseInput,
			riskMode: 'ABSOLUTE',
			riskValue: 200,
		});

		expect(result.isValid).toBe(true);
		expect(result.positionSize).toBe(40);
		expect(result.actualRiskAmount).toBe(200);
	});

	it('contractSize scales position inversely (forex-style)', () => {
		const result = calculatePositionSize({
			...baseInput,
			accountBalance: 500_000,
			riskMode: 'ABSOLUTE',
			riskValue: 100,
			entryPrice: 1.1,
			stopLossPrice: 1.099,
			contractSize: 100_000,
		});

		// priceDistance = 0.001, risk = 100
		// positionSize = 100 / (0.001 × 100000) = 1 lot
		expect(result.isValid).toBe(true);
		expect(result.positionSize).toBeCloseTo(1, 10);
		expect(result.journalQuantity).toBeCloseTo(100_000, 5);
	});

	it('futures contractSize as point value', () => {
		const result = calculatePositionSize({
			...baseInput,
			accountBalance: 500_000,
			riskMode: 'ABSOLUTE',
			riskValue: 500,
			entryPrice: 4_500,
			stopLossPrice: 4_490,
			contractSize: 50,
			leverage: 1,
		});

		// distance = 10, positionSize = 500 / (10 × 50) = 1
		expect(result.isValid).toBe(true);
		expect(result.positionSize).toBe(1);
		expect(result.notionalValue).toBe(4_500 * 50);
	});

	it('leverage reduces required margin', () => {
		const result = calculatePositionSize({
			...baseInput,
			leverage: 5,
		});

		expect(result.isValid).toBe(true);
		expect(result.requiredMargin).toBe(800);
	});

	describe('Rule C — invalid inputs', () => {
		it('rejects zero account balance', () => {
			const result = calculatePositionSize({
				...baseInput,
				accountBalance: 0,
			});
			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.INVALID_INPUTS,
			);
		});

		it('rejects entry equal to stop-loss', () => {
			const result = calculatePositionSize({
				...baseInput,
				stopLossPrice: 100,
			});
			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.INVALID_INPUTS,
			);
		});

		it('rejects leverage below 1', () => {
			const result = calculatePositionSize({
				...baseInput,
				leverage: 0.5,
			});
			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.INVALID_INPUTS,
			);
		});

		it('rejects percentage risk above 100%', () => {
			const result = calculatePositionSize({
				...baseInput,
				riskValue: 101,
			});
			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.INVALID_INPUTS,
			);
		});

		it('rejects percentage risk at 0%', () => {
			const result = calculatePositionSize({
				...baseInput,
				riskValue: 0,
			});
			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.INVALID_INPUTS,
			);
		});
	});

	describe('Rule B — liquidation before stop-loss', () => {
		it('fails when stop distance equals liquidation threshold (10x, 10% SL)', () => {
			const result = calculatePositionSize({
				...baseInput,
				entryPrice: 100,
				stopLossPrice: 90,
				leverage: 10,
				riskMode: 'ABSOLUTE',
				riskValue: 100,
			});

			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.LIQUIDATION_BEFORE_STOP_LOSS,
			);
			expect(result.positionSize).toBeGreaterThan(0);
		});

		it('fails when stop is wider than liquidation threshold', () => {
			const result = calculatePositionSize({
				...baseInput,
				entryPrice: 100,
				stopLossPrice: 85,
				leverage: 10,
			});

			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.LIQUIDATION_BEFORE_STOP_LOSS,
			);
		});

		it('passes when stop is inside liquidation threshold', () => {
			const result = calculatePositionSize({
				...baseInput,
				entryPrice: 100,
				stopLossPrice: 91,
				leverage: 10,
				accountBalance: 50_000,
			});

			expect(result.isValid).toBe(true);
		});
	});

	describe('Rule A — insufficient margin', () => {
		it('fails when required margin exceeds account balance', () => {
			const result = calculatePositionSize({
				...baseInput,
				accountBalance: 1_000,
				riskMode: 'ABSOLUTE',
				riskValue: 200,
				leverage: 1,
			});

			expect(result.isValid).toBe(false);
			expect(result.validationError).toBe(
				PositionSizeValidationError.INSUFFICIENT_MARGIN,
			);
			expect(result.requiredMargin).toBeGreaterThan(1_000);
		});
	});

	describe('size step rounding', () => {
		it('rounds position size down and lowers actual risk', () => {
			const exact = calculatePositionSize({
				...baseInput,
				riskMode: 'ABSOLUTE',
				riskValue: 250,
				entryPrice: 100,
				stopLossPrice: 97,
				sizeStep: 'exact',
			});

			const rounded = calculatePositionSize({
				...baseInput,
				riskMode: 'ABSOLUTE',
				riskValue: 250,
				entryPrice: 100,
				stopLossPrice: 97,
				sizeStep: '1',
			});

			// exact: 250 / 3 ≈ 83.333...
			expect(exact.positionSize).toBeCloseTo(250 / 3, 10);
			expect(rounded.positionSize).toBe(83);
			expect(rounded.actualRiskAmount).toBeLessThan(exact.actualRiskAmount);
			expect(rounded.actualRiskAmount).toBe(83 * 3);
		});
	});
});
