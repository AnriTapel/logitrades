import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { resetPasswordSchema } from '$lib/schemas/authSchemas';
import { httpClient } from '$lib/server/http-client/http-client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const form = await superValidate(zod(resetPasswordSchema));

	if (token) {
		form.data.token = token;
	}

	return { form, hasToken: !!token };
};

export const actions = {
	default: async ({ request, fetch }) => {
		const form = await superValidate(request, zod(resetPasswordSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await httpClient.post('/auth/reset-password', {
				payload: {
					token: form.data.token,
					password: form.data.password,
				},
				fetch,
			});
			return { form, success: true };
		} catch (err: unknown) {
			const error = err as { detail?: string } | null;
			return fail(400, {
				form,
				error: error?.detail || 'Failed to reset password',
			});
		}
	},
};

