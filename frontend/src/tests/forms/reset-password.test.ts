import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ResetPasswordPage from '../../routes/reset-password/+page.svelte';
import { resetPasswordSchema } from '$lib/schemas/authSchemas';
import { createEmptyForm } from './helpers';

describe('reset-password page client validation', () => {
	it('shows error when confirm password does not match', async () => {
		const user = userEvent.setup();
		const form = await createEmptyForm(resetPasswordSchema);
		form.data.token = 'test-token';

		render(ResetPasswordPage, {
			props: {
				params: {},
				data: {
					form,
					hasToken: true,
					isAuthenticated: false,
					user: null,
					showAppChrome: false,
					portfolios: [],
					activePortfolioId: undefined,
				},
				form: null,
			},
		});

		await user.type(screen.getByLabelText('New Password'), 'ValidPass1!');
		await user.type(screen.getByLabelText('Confirm New Password'), 'Different1!');
		await user.click(screen.getByRole('button', { name: 'Reset Password' }));

		expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
	});
});
