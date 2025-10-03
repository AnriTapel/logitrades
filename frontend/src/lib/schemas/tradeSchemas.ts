import { formatDateTimeISO } from '$lib/formatters';
import { z } from 'zod';

export const formSchema = z.object({
	id: z.number().optional(),
	createdAt: z.string().datetime().optional().nullable(),
	symbol: z
		.string()
		.max(24, { message: 'Symbol must be less than 24 characters' })
		.nonempty({
			message: 'Symbol is required',
		}),
	tradeType: z.enum(['buy', 'sell']),
	useLeverage: z.boolean(),
	leverage: z.number().default(1),
	quantity: z
		.number()
		.step(0.1, { message: 'Quantity must be a multiple of 0.1' })
		.min(0.1, { message: 'Quantity must be greater than 0.1' })
		.max(1000000, { message: 'Quantity must be less than 1,000,000' }),
	openPrice: z
		.number()
		.step(0.001, {
			message: 'Open Price must be a number with 2 decimal places',
		})
		.min(0.001, { message: 'Open Price must be greater than 0' }),
	openedAt: z.string().datetime().default(formatDateTimeISO(new Date())),
	takeProfit: z
		.number()
		.step(0.001, {
			message: 'Take Profit must be a number with 2 decimal places',
		})
		.min(0.001, { message: 'Take Profit must be greater than 0' })
		.optional()
		.nullable(),
	stopLoss: z
		.number()
		.step(0.001, {
			message: 'Stop Loss must be a number with 2 decimal places',
		})
		.min(0.001, { message: 'Stop Loss must be greater than 0' })
		.optional()
		.nullable(),
	closePrice: z
		.number()
		.step(0.001, {
			message: 'Close Price must be a number with 2 decimal places',
		})
		.min(0.001, { message: 'Close Price must be greater than 0' })
		.optional()
		.nullable(),
	closedAt: z.string().datetime().optional().nullable(),
});

export type TradeFormSchema = typeof formSchema;

export type TradeFormInput = z.infer<TradeFormSchema>;
