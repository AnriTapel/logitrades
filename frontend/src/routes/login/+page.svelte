<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { loginSchema, type LoginFormInput } from '$lib/schemas/authSchemas';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { goto } from '$app/navigation';
    import {showServerErrors} from "$lib/stores/error";
    import type {HttpError} from "$lib/server/http-client/types";

	export let data: { form: SuperValidated<LoginFormInput> };

	const form = superForm(data.form, {
		validators: zodClient(loginSchema),
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				goto(result.location);
			} else if (result.type == 'failure') {
                showServerErrors(result.data?.error as HttpError);
            }
		}
	});

	const { form: formData, enhance } = form;
</script>

<div class="flex items-center justify-center min-h-screen">
	<div class="w-full max-w-md p-8 space-y-8">
		<h1 class="text-2xl font-bold text-center">Login</h1>
		<form method="POST" use:enhance class="space-y-4">
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
			<Button type="submit" class="w-full">Login</Button>
			<div class="text-center">
				<a href="/signup" class="text-sm text-primary hover:underline">
					Don't have an account? Sign up
				</a>
			</div>
		</form>
	</div>
</div>
