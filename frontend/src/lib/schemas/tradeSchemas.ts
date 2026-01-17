import { formatDateTimeISO } from '$lib/formatters';
import { z } from 'zod';

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
	quantity: z
		.number()
		.min(0.000000001, { message: 'Quantity must be greater than 0.000000001' })
		.refine((value) => /^\d+(\.\d{1,9})?$/.test(value.toString()), {
			message: 'Quantity cannot have more than 9 decimal places',
		}),
	openPrice: z
		.number()
		.min(0.000000001, {
			message: 'Open Price must be greater than 0.000000001',
		})
		.refine((value) => /^\d+(\.\d{1,9})?$/.test(value.toString()), {
			message: 'Open Price cannot have more than 9 decimal places',
		}),
	openedAt: z.string().datetime().default(formatDateTimeISO(new Date())),
	takeProfit: z
		.number()
		.min(0.000000001, {
			message: 'Take Profit must be greater than 0.000000001',
		})
		.refine((value) => /^\d+(\.\d{1,9})?$/.test(value.toString()), {
			message: 'Take Profit cannot have more than 9 decimal places',
		})
		.optional()
		.nullable(),
	stopLoss: z
		.number()
		.min(0.000000001, { message: 'Stop Loss must be greater than 0.000000001' })
		.refine((value) => /^\d+(\.\d{1,9})?$/.test(value.toString()), {
			message: 'Stop Loss cannot have more than 9 decimal places',
		})
		.optional()
		.nullable(),
	closePrice: z
		.number()
		.min(0.000000001, {
			message: 'Close Price must be greater than 0.000000001',
		})
		.refine((value) => /^\d+(\.\d{1,9})?$/.test(value.toString()), {
			message: 'Close Price cannot have more than 9 decimal places',
		})
		.optional()
		.nullable(),
	closedAt: z.string().datetime().optional().nullable(),
});

export type TradeFormInput = z.infer<typeof formSchema>;
