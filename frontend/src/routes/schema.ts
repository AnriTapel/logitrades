import { z } from 'zod';

export const formSchema = z.object({
	symbol: z
		.string()
		.max(24, { message: 'Symbol must be less than 24 characters' })
		.nonempty({
			message: 'Symbol is required',
		}),
	tradeType: z.enum(['buy', 'sell']),
	useLeverage: z.boolean(),
	leverage: z.number().array().length(1).default([1]),
	quantity: z
		.number()
		.step(1, { message: 'Quantity must be a whole number' })
		.min(1, { message: 'Quantity must be greater than 0' })
		.max(1000000, { message: 'Quantity must be less than 1,000,000' }),
	price: z
		.number()
		.step(0.001, { message: 'Price must be a number with 2 decimal places' })
		.min(0.001, { message: 'Price must be greater than 0' }),
	openedAt: z.string().datetime(),
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
	comment: z.string().max(128).optional(),
});

export type FormSchema = typeof formSchema;

export type TradeFormInput = z.infer<FormSchema>;
