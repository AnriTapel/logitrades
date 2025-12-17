import { z } from 'zod';

export const loginSchema = z.object({
	username: z
		.string()
		.min(4, 'Username must be at least 4 characters long')
		.max(16, 'Username must be at most 16 characters long'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters long')
		.max(32, 'Password must be at most 32 characters long'),
});

export type LoginFormInput = z.infer<typeof loginSchema>;

export const signupSchema = z
	.object({
		email: z.string().email(),
		username: z
			.string()
			.min(4, 'Username must be at least 4 characters long')
			.max(16, 'Username must be at most 16 characters long')
			.regex(
				/^[a-zA-Z0-9_]+$/,
				'Username can only contain letters, numbers, and underscores'
			),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters long')
			.max(32, 'Password must be at most 32 characters long')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
				'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

export type SignupFormInput = z.infer<typeof signupSchema>;
