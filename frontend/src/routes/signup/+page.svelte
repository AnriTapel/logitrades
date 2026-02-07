<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { signupSchema, type SignupFormInput } from '$lib/schemas/authSchemas';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { goto } from '$app/navigation';
	import { showServerErrors } from '$lib/stores/error';
	import type { HttpError } from '$lib/server/http-client/types';

	export let data: { form: SuperValidated<SignupFormInput> };

	const form = superForm(data.form, {
		validators: zodClient(signupSchema),
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				goto(result.location);
			} else if (result.type == 'failure') {
				showServerErrors(result.data?.error as HttpError);
			}
		},
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Create Your Trading Journal Account | LogiTrades</title>
</svelte:head>

<div class="flex items-center justify-center grow">
	<div class="w-full max-w-md p-8 space-y-8">
		<h1 class="text-2xl font-bold text-center">Sign Up</h1>
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
			<Field {form} name="username">
				<Control>
					{#snippet children({ props })}
						<FormLabel>Username</FormLabel>
						<Input {...props} bind:value={$formData.username} />
					{/snippet}
				</Control>
				<FieldErrors />
			</Field>
			<Field {form} name="password">
				<Control>
					{#snippet children({ props })}
						<FormLabel>Password</FormLabel>
						<Input {...props} type="password" bind:value={$formData.password} />
					{/snippet}
				</Control>
				<FieldErrors />
			</Field>
			<Field {form} name="confirmPassword">
				<Control>
					{#snippet children({ props })}
						<FormLabel>Confirm Password</FormLabel>
						<Input
							{...props}
							type="password"
							bind:value={$formData.confirmPassword}
						/>
					{/snippet}
				</Control>
				<FieldErrors />
			</Field>
			<Button type="submit" class="w-full">Sign Up</Button>
			<div class="text-center">
				<a href="/login" class="text-sm text-primary hover:underline">
					Already have an account? Login
				</a>
			</div>
		</form>
	</div>
</div>
