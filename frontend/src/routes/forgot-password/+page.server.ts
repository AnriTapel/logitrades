import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { forgotPasswordSchema } from '$lib/schemas/authSchemas';
import { httpClient } from '$lib/server/http-client/http-client';

export const load = async () => {
	const form = await superValidate(zod(forgotPasswordSchema));
	return { form };
};

export const actions = {
	default: async ({ request, fetch }) => {
		const form = await superValidate(request, zod(forgotPasswordSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await httpClient.post('/auth/forgot-password', {
				payload: form.data,
				fetch,
			});
		} catch {
			// Silently continue - don't reveal if email exists
		}

		throw redirect(303, '/check-email-reset');
	},
};

