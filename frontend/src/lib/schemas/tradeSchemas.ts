import { toUtcIso, type UtcIsoDateTime } from '$lib/dates';
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

const utcIsoDateTimeSchema = z
	.string()
	.datetime({ offset: true })
	.transform(toUtcIso);

const optionalUtcIsoDateTimeSchema = z.preprocess(
	(val) => (val === '' || val === null || val === undefined ? null : val),
	z
		.string()
		.datetime({ offset: true })
		.transform(toUtcIso)
		.nullable()
		.optional(),
);

export const MAX_TRADE_TAGS = 3;

export const tagSchema = z
	.string()
	.trim()
	.min(1)
	.max(16, { message: 'Each tag must be at most 16 characters' })
	.regex(/^[A-Za-z0-9_-]+$/, {
		message: 'Tags can contain only letters, numbers, - and _',
	});

export const tagsSchema = z
	.array(tagSchema)
	.max(MAX_TRADE_TAGS, {
		message: `Maximum ${MAX_TRADE_TAGS} tags per trade`,
	});

export const formSchema = z.object({
	id: z.number().optional(),
	createdAt: optionalUtcIsoDateTimeSchema,
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
	comment: z
		.string()
		.max(255, { message: 'Comment must be less than 255 characters' })
		.regex(/^[A-Za-z0-9\s.'",!?-_]*$/, {
			message:
				'Comment can contain only letters, numbers, spaces, and punctuation',
		})
		.optional(),
	tags: tagsSchema.optional(),
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
	openedAt: utcIsoDateTimeSchema.default(() => toUtcIso(new Date())),
	takeProfit: optionalDecimal('Take Profit'),
	stopLoss: optionalDecimal('Stop Loss'),
	closePrice: optionalDecimal('Close Price'),
	closedAt: optionalUtcIsoDateTimeSchema,
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
		openedAt: toUtcIso(new Date()),
	};
}
