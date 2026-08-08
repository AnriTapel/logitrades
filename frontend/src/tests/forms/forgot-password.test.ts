import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ForgotPasswordPage from '../../routes/forgot-password/+page.svelte';
import { forgotPasswordSchema } from '$lib/schemas/authSchemas';
import { createEmptyForm } from './helpers';

describe('forgot-password page client validation', () => {
	it('shows error for invalid email', async () => {
		const user = userEvent.setup();
		const form = await createEmptyForm(forgotPasswordSchema);

		render(ForgotPasswordPage, {
			props: {
				params: {},
				form: null,
				data: {
					form,
					isAuthenticated: false,
					user: null,
					showAppChrome: false,
					portfolios: [],
					activePortfolioId: undefined,
				},
			},
		});

		await user.type(screen.getByLabelText('Email'), 'not-an-email');
		await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

		expect(
			await screen.findByText('Please enter a valid email address'),
		).toBeInTheDocument();
	});
});
