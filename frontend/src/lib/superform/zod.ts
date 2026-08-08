import type { z } from 'zod';
import {
	zod as zodAdapter,
	type ValidationAdapter,
	type ZodValidation,
} from 'sveltekit-superforms/adapters';

/** Cast at the Superforms boundary; ZodObjectType is too strict under TS 6. */
export function zod<T extends z.ZodTypeAny>(
	schema: T,
): ValidationAdapter<z.infer<T>, z.input<T>> {
	return zodAdapter(schema as unknown as ZodValidation) as ValidationAdapter<
		z.infer<T>,
		z.input<T>
	>;
}
