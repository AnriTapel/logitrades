import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { httpClient } from '$lib/server/http-client/http-client';
import type { Subscription, SubscriptionInvoice } from '$lib/types';

async function loadCurrentSubscription(
	fetch: typeof globalThis.fetch,
): Promise<Subscription | null> {
	try {
		return await httpClient.get<Subscription>('/payments/subscriptions/current', {
			fetch,
		});
	} catch {
		return null;
	}
}

async function loadInvoices(
	fetch: typeof globalThis.fetch,
): Promise<SubscriptionInvoice[]> {
	try {
		const invoices = await httpClient.get<SubscriptionInvoice[]>(
			'/payments/subscription-invoices',
			{ fetch },
		);
		return invoices ?? [];
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ parent, fetch }) => {
	const { isAuthenticated, user } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	const [subscription, invoices] = await Promise.all([
		loadCurrentSubscription(fetch),
		loadInvoices(fetch),
	]);

	const sortedInvoices = [...invoices].sort((a, b) => {
		const aDate = a.created_at ?? '';
		const bDate = b.created_at ?? '';
		return bDate.localeCompare(aDate);
	});

	return {
		user,
		plan: user?.plan ?? 'free',
		subscription,
		invoices: sortedInvoices,
	};
};

export const actions = {
	resendVerification: async ({ fetch }) => {
		try {
			await httpClient.post('/auth/resend-verification', { fetch });
			return { success: true };
		} catch (err: unknown) {
			const error = err as { detail?: string } | null;
			return fail(400, {
				error: error?.detail || 'Failed to resend verification email',
			});
		}
	},
} satisfies Actions;
