export type RiskMode = 'PERCENTAGE' | 'ABSOLUTE';

export type SizeStepPreset =
	| 'exact'
	| '1'
	| '0.1'
	| '0.01'
	| '0.001'
	| '0.0001'
	| '0.00000001';

export const SIZE_STEP_OPTIONS: {
	value: SizeStepPreset;
	label: string;
	step: number | null;
}[] = [
	{ value: 'exact', label: 'Exact (no rounding)', step: null },
	{ value: '1', label: '1 — whole shares / contracts', step: 1 },
	{ value: '0.1', label: '0.1 — mini-lot style', step: 0.1 },
	{ value: '0.01', label: '0.01 — standard forex lot', step: 0.01 },
	{ value: '0.001', label: '0.001 — micro lots', step: 0.001 },
	{ value: '0.0001', label: '0.0001 — fractional shares', step: 0.0001 },
	{
		value: '0.00000001',
		label: '0.00000001 — high-precision crypto',
		step: 0.00000001,
	},
];

export enum PositionSizeValidationError {
	INVALID_INPUTS = 'INVALID_INPUTS',
	LIQUIDATION_BEFORE_STOP_LOSS = 'LIQUIDATION_BEFORE_STOP_LOSS',
	INSUFFICIENT_MARGIN = 'INSUFFICIENT_MARGIN',
}

export const POSITION_SIZE_VALIDATION_MESSAGES: Record<
	PositionSizeValidationError,
	string
> = {
	[PositionSizeValidationError.INVALID_INPUTS]:
		'Invalid inputs. Ensure all values are positive, entry and stop-loss differ, leverage is at least 1, and percentage risk is between 0 and 100.',
	[PositionSizeValidationError.LIQUIDATION_BEFORE_STOP_LOSS]:
		'Liquidation threshold reached before technical Stop-Loss. Reduce leverage or tighten your Stop-Loss distance.',
	[PositionSizeValidationError.INSUFFICIENT_MARGIN]:
		'Insufficient account balance to cover the required margin for this leverage configuration.',
};

export interface PositionSizeInput {
	accountBalance: number;
	riskMode: RiskMode;
	riskValue: number;
	entryPrice: number;
	stopLossPrice: number;
	leverage: number;
	contractSize: number;
	sizeStep: SizeStepPreset;
}

export interface PositionSizeResult {
	positionSize: number;
	notionalValue: number;
	requiredMargin: number;
	actualRiskAmount: number;
	stopLossPercent: number;
	journalQuantity: number;
	isValid: boolean;
	validationError: PositionSizeValidationError | null;
	validationMessage: string | null;
}

const EPSILON = 1e-12;

function isPositiveFinite(value: number): boolean {
	return Number.isFinite(value) && value > 0;
}

function getSizeStepValue(preset: SizeStepPreset): number | null {
	return (
		SIZE_STEP_OPTIONS.find((option) => option.value === preset)?.step ?? null
	);
}

function roundDownToStep(value: number, step: number): number {
	return Math.floor(value / step) * step;
}

function validateInput(input: PositionSizeInput): boolean {
	const {
		accountBalance,
		riskValue,
		entryPrice,
		stopLossPrice,
		contractSize,
		leverage,
		riskMode,
	} = input;

	if (
		!isPositiveFinite(accountBalance) ||
		!isPositiveFinite(riskValue) ||
		!isPositiveFinite(entryPrice) ||
		!isPositiveFinite(stopLossPrice) ||
		!isPositiveFinite(contractSize)
	) {
		return false;
	}

	if (Math.abs(entryPrice - stopLossPrice) < EPSILON) {
		return false;
	}

	if (!Number.isFinite(leverage) || leverage < 1) {
		return false;
	}

	if (riskMode === 'PERCENTAGE' && (riskValue <= 0 || riskValue > 100)) {
		return false;
	}

	return true;
}

function emptyResult(error: PositionSizeValidationError): PositionSizeResult {
	return {
		positionSize: 0,
		notionalValue: 0,
		requiredMargin: 0,
		actualRiskAmount: 0,
		stopLossPercent: 0,
		journalQuantity: 0,
		isValid: false,
		validationError: error,
		validationMessage: POSITION_SIZE_VALIDATION_MESSAGES[error],
	};
}

export function calculatePositionSize(
	input: PositionSizeInput,
): PositionSizeResult {
	if (!validateInput(input)) {
		return emptyResult(PositionSizeValidationError.INVALID_INPUTS);
	}

	const {
		accountBalance,
		riskMode,
		riskValue,
		entryPrice,
		stopLossPrice,
		leverage,
		contractSize,
		sizeStep,
	} = input;

	const riskAmount =
		riskMode === 'PERCENTAGE' ? accountBalance * (riskValue / 100) : riskValue;

	const priceDistance = Math.abs(entryPrice - stopLossPrice);

	let positionSize = riskAmount / (priceDistance * contractSize);

	const sizeStepValue = getSizeStepValue(sizeStep);
	if (sizeStepValue !== null) {
		positionSize = roundDownToStep(positionSize, sizeStepValue);
	}

	const notionalValue = positionSize * entryPrice * contractSize;
	const requiredMargin = notionalValue / leverage;
	const actualRiskAmount = positionSize * priceDistance * contractSize;
	const stopLossPercent = (priceDistance / entryPrice) * 100;
	const journalQuantity = positionSize * contractSize;

	const liquidationOverlap =
		priceDistance / entryPrice >= 1 / leverage - EPSILON;

	if (liquidationOverlap) {
		return {
			positionSize,
			notionalValue,
			requiredMargin,
			actualRiskAmount,
			stopLossPercent,
			journalQuantity,
			isValid: false,
			validationError: PositionSizeValidationError.LIQUIDATION_BEFORE_STOP_LOSS,
			validationMessage:
				POSITION_SIZE_VALIDATION_MESSAGES[
					PositionSizeValidationError.LIQUIDATION_BEFORE_STOP_LOSS
				],
		};
	}

	if (requiredMargin > accountBalance + EPSILON) {
		return {
			positionSize,
			notionalValue,
			requiredMargin,
			actualRiskAmount,
			stopLossPercent,
			journalQuantity,
			isValid: false,
			validationError: PositionSizeValidationError.INSUFFICIENT_MARGIN,
			validationMessage:
				POSITION_SIZE_VALIDATION_MESSAGES[
					PositionSizeValidationError.INSUFFICIENT_MARGIN
				],
		};
	}

	return {
		positionSize,
		notionalValue,
		requiredMargin,
		actualRiskAmount,
		stopLossPercent,
		journalQuantity,
		isValid: true,
		validationError: null,
		validationMessage: null,
	};
}
