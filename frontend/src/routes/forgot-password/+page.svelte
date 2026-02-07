<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import {
		forgotPasswordSchema,
		type ForgotPasswordFormInput,
	} from '$lib/schemas/authSchemas';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { goto } from '$app/navigation';

	let { data }: { data: { form: SuperValidated<ForgotPasswordFormInput> } } =
		$props();

	const form = superForm(data.form, {
		validators: zodClient(forgotPasswordSchema),
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				goto(result.location);
			}
		},
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Forgot Password - Reset Your Account | LogiTrades</title>
</svelte:head>

<div class="flex items-center justify-center grow">
	<div class="w-full max-w-md p-8 space-y-8">
		<h1 class="text-2xl font-bold text-center">Forgot Password</h1>
		<p class="text-muted-foreground text-center">
			Enter your email address and we'll send you a link to reset your password.
		</p>
		<form method="POST" use:enhance class="space-y-4">
			<Field {form} name="email">
				<Control>
					{#snippet children({ props })}
						<FormLabel>Email</FormLabel>
						<Input {...props} type="email" bind:value={$formData.email} />
					{/snippet}
				</Control>
				<FieldErrors />
			</Field>
			<Button type="submit" class="w-full">Send Reset Link</Button>
			<div class="text-center">
				<a href="/login" class="text-sm text-primary hover:underline">
					Back to Login
				</a>
			</div>
		</form>
	</div>
</div>
