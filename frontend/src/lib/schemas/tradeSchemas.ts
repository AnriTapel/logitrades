import { formatDateTimeISO } from '$lib/formatters';
import { z } from 'zod';

const MIN_POSITIVE_DECIMAL = 0.000000001;
const DECIMAL_PLACES_REGEX = /^\d+(\.\d{1,9})?$/;

const coerceFormNumber = (val: unknown): number | undefined =>
	val === '' || val === null || val === undefined ? undefined : Number(val);

const withPositiveDecimalChecks = (schema: z.ZodNumber, label: string) =>
	schema
		.min(MIN_POSITIVE_DECIMAL, {
			message: `${label} must be greater than 0`,
		})
		.refine((value) => DECIMAL_PLACES_REGEX.test(value.toString()), {
			message: `${label} cannot have more than 9 decimal places`,
		});

const requiredDecimal = (label: string) =>
	z.preprocess(
		coerceFormNumber,
		withPositiveDecimalChecks(
			z.number({
				required_error: `${label} is required`,
				invalid_type_error: `${label} must be a number`,
			}),
			label,
		),
	);

const optionalDecimal = (label: string) =>
	z.preprocess(
		coerceFormNumber,
		withPositiveDecimalChecks(
			z.number({
				invalid_type_error: `${label} must be a number`,
			}),
			label,
		)
			.optional()
			.nullable(),
	);

export const formSchema = z.object({
	id: z.number().optional(),
	createdAt: z.string().datetime().optional().nullable(),
	symbol: z
		.string()
		.min(1, { message: 'Symbol must be at least 1 character' })
		.max(24, { message: 'Symbol must be less than 24 characters' })
		.regex(/^[A-Za-z0-9\/-]+$/, {
			message: 'Symbol can contain only letters, numbers and / -',
		})
		.nonempty({
			message: 'Symbol is required',
		}),
	tradeType: z.enum(['buy', 'sell'], {
		required_error: 'Side is required',
		invalid_type_error: 'Side must be either buy or sell',
		message: 'Side must be either buy or sell',
	}),
	useLeverage: z.boolean(),
	leverage: z
		.number()
		.min(1, { message: 'Leverage must be equal or greater than 1' })
		.max(50, { message: 'Leverage must be equal or less than 50' })
		.default(1),
	quantity: requiredDecimal('Quantity'),
	openPrice: requiredDecimal('Open Price'),
	openedAt: z.string().datetime().default(formatDateTimeISO(new Date())),
	takeProfit: optionalDecimal('Take Profit'),
	stopLoss: optionalDecimal('Stop Loss'),
	closePrice: optionalDecimal('Close Price'),
	closedAt: z.string().datetime().optional().nullable(),
});

/** Validated form output (after Zod parse). */
export type TradeFormInput = z.infer<typeof formSchema>;

/** In-progress form state — required decimals may be empty before submit. */
export type TradeFormData = Omit<TradeFormInput, 'quantity' | 'openPrice'> & {
	quantity?: number;
	openPrice?: number;
};

export function createTradeFormDefaults(): TradeFormData {
	return {
		symbol: '',
		tradeType: 'buy',
		useLeverage: false,
		leverage: 1,
		openedAt: formatDateTimeISO(new Date()),
	};
}
