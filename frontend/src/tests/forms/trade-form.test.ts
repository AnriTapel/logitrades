import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { superValidate } from 'sveltekit-superforms';
import { describe, expect, it } from 'vitest';
import TradeForm from '$lib/layouts/trade-form.svelte';
import {
	createTradeFormDefaults,
	formSchema,
} from '$lib/schemas/tradeSchemas';
import { zod } from '$lib/superform/zod';

describe('trade form client validation', () => {
	it('shows error when symbol is empty on submit', async () => {
		const user = userEvent.setup();
		const form = await superValidate(zod(formSchema), {
			errors: false,
			defaults: createTradeFormDefaults(),
		});

		render(TradeForm, {
			props: {
				data: form,
				existingSymbols: [],
				existingTags: [],
			},
		});

		await user.type(screen.getByLabelText(/Quantity/i), '1');
		await user.type(screen.getByLabelText(/Open Price/i), '100');
		await user.click(screen.getByRole('button', { name: 'Submit Trade' }));

		expect(
			await screen.findByText(/Symbol (is required|must be at least 1 character)/),
		).toBeInTheDocument();
	});
});
