import { superValidate } from 'sveltekit-superforms';
import type { z } from 'zod';
import { zod } from '$lib/superform/zod';

export async function createEmptyForm<T extends z.ZodTypeAny>(schema: T) {
	return superValidate(zod(schema));
}
