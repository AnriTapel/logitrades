import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schemas/authSchemas';
import { httpClient } from '$lib/server/http-client/http-client';

export const load = async () => {
	const form = await superValidate(zod(loginSchema));
	return { form };
};

export const actions = {
	default: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(loginSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const result = await httpClient.authRequest(
			'/auth/login',
			form.data,
			fetch,
			cookies
		);

		if (!result.success) {
			return fail(result.status, { form, error: result.error });
		}

		throw redirect(303, '/');
	},
};
