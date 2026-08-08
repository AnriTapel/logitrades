import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import LoginPage from '../../routes/login/+page.svelte';
import { loginSchema } from '$lib/schemas/authSchemas';
import { createEmptyForm } from './helpers';

describe('login page client validation', () => {
	it('shows username error for input shorter than 4 characters', async () => {
		const user = userEvent.setup();
		const form = await createEmptyForm(loginSchema);

		render(LoginPage, {
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

		await user.type(screen.getByLabelText('Username'), 'ab');
		await user.type(screen.getByLabelText('Password'), 'password123');
		await user.click(screen.getByRole('button', { name: 'Login' }));

		expect(
			await screen.findByText('Username must be at least 4 characters long'),
		).toBeInTheDocument();
	});
});
