import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { formSchema, type TradeFormInput } from "$lib/schemas/tradeSchemas";
import { fail, redirect } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import type { Trade } from "$lib/types";
import {
	convertUiTradeToTradeFormInput,
	normalizeTradeFormInputForApi,
} from "$lib/tradeConverters";
import { httpClient } from "$lib/server/http-client/http-client";

export const load: PageServerLoad = async ({ url, parent }) => {
	const { isAuthenticated, trades } = await parent();
	if (!isAuthenticated) {
		throw redirect(303, "/login");
	}

	const tradeId = url.searchParams.get("edit");
	let form;

	if (tradeId) {
		const tradeToEdit = trades.find((trade: Trade) => trade.id === Number(tradeId));
		form = tradeToEdit
			? await superValidate(convertUiTradeToTradeFormInput(tradeToEdit), zod(formSchema))
			: await superValidate(zod(formSchema));
	} else {
		form = await superValidate(zod(formSchema));
	}

	return { form, isEditMode: tradeId !== null };
};

export const actions = {
	create: async ({ request, fetch }) => {
		const form = await superValidate<TradeFormInput>(request, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: "Form validation failed. Please check your input.",
			});
		}

		try {
			await httpClient.post<TradeFormInput, unknown>("/trades", {
				payload: normalizeTradeFormInputForApi(form.data),
				fetch,
			});

			return { success: true, form };
		} catch (error) {
			return fail(500, { form, error });
		}
	},

	update: async ({ request, fetch }) => {
		const form = await superValidate(request, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: "Form validation failed. Please check your input.",
			});
		}

		try {
			await httpClient.put<TradeFormInput>(`/trades/${form.data.id}`, {
				payload: normalizeTradeFormInputForApi(form.data),
				fetch,
			});
		} catch (error) {
			return fail(500, { form, error });
		}

		throw redirect(303, "?");
	},

	delete: async ({ request, fetch }) => {
		const formData = await request.formData();
		const tradeId = formData.get("tradeId");

		if (!tradeId || isNaN(Number(tradeId))) {
			return fail(400, { error: "Invalid trade ID" });
		}

		try {
			await httpClient.delete(`/trades/${tradeId}`, { fetch });
			return { success: true };
		} catch (error) {
			return fail(500, { error });
		}
	},

	import: async ({ request, fetch }) => {
		const formData = await request.formData();

		try {
			await httpClient.sendFormData("/trades/import", formData, { fetch });
			return { success: true };
		} catch (error) {
			return fail(500, { error });
		}
	},

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
} satisfies Actions;
