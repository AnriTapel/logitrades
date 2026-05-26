import type { Actions, PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { httpClient } from "$lib/server/http-client/http-client";

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
} satisfies Actions;
