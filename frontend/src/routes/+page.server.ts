import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { httpClient } from "$lib/server/http-client/http-client";
import {
	SUPPORTED_CURRENCY_CODES,
	type CurrencyCode,
} from "$lib/constants/currencies";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, "/journal");
	}

	return {};
};

export const actions = {
	logout: async ({ cookies, fetch }) => {
		try {
			await httpClient.post("/auth/logout", {
				fetch,
			});
		} catch (error) {
			console.error("Logout error:", error);
		}

		cookies.set("access_token", "", {
			path: "/",
			expires: new Date(0),
			sameSite: "lax",
		});
		cookies.set("refresh_token", "", {
			path: "/",
			expires: new Date(0),
			sameSite: "lax",
		});
		throw redirect(303, "/login");
	},

	updateCurrency: async ({ request, fetch, locals }) => {
		if (!locals.user) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const currency = String(formData.get("currency") ?? "");
		const plan = String(formData.get("plan") ?? locals.user.plan ?? "free");
		const portfolioIdRaw = formData.get("portfolio_id");
		const portfolioId =
			portfolioIdRaw != null && portfolioIdRaw !== ""
				? Number(portfolioIdRaw)
				: null;

		if (!SUPPORTED_CURRENCY_CODES.has(currency as CurrencyCode)) {
			return fail(400, { error: "Unsupported currency" });
		}

		try {
			const isPaid = plan === "pro" || plan === "max";
			if (isPaid) {
				if (portfolioId == null || isNaN(portfolioId)) {
					return fail(400, { error: "portfolio_id required" });
				}
				await httpClient.patch(`/portfolios/${portfolioId}`, {
					payload: { currency },
					fetch,
				});
			} else {
				await httpClient.patch("/auth/me", {
					payload: { currency },
					fetch,
				});
			}
			return { success: true, currency };
		} catch {
			return fail(500, { error: "Failed to update currency" });
		}
	},
} satisfies Actions;
