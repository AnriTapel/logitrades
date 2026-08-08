import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import SignupPage from '../../routes/signup/+page.svelte';
import { signupSchema } from '$lib/schemas/authSchemas';
import { createEmptyForm } from './helpers';

describe('signup page client validation', () => {
	it('shows error when confirm password does not match', async () => {
		const user = userEvent.setup();
		const form = await createEmptyForm(signupSchema);

		render(SignupPage, {
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

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.type(screen.getByLabelText('Username'), 'testuser');
		await user.type(screen.getByLabelText('Password'), 'ValidPass1!');
		await user.type(screen.getByLabelText('Confirm Password'), 'Different1!');
		await user.click(screen.getByRole('button', { name: 'Sign Up' }));

		expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
	});
});
