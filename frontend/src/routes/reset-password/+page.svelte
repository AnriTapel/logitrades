<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import {
		resetPasswordSchema,
		type ResetPasswordFormInput,
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
	import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';

	let {
		data,
		form: actionData,
	}: {
		data: { form: SuperValidated<ResetPasswordFormInput>; hasToken: boolean };
		form: { success?: boolean; error?: string } | null;
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(resetPasswordSchema),
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Reset Your Password | LogiTrades</title>
</svelte:head>

<div class="flex items-center justify-center grow">
	<div class="w-full max-w-md p-8 space-y-6">
		{#if !data.hasToken}
			<div class="text-center flex flex-col items-center gap-4">
				<CircleSlashIcon class="size-12" />
				<h1 class="text-2xl font-bold">Invalid Link</h1>
				<p class="text-muted-foreground">
					This password reset link is invalid or missing a token.
				</p>
				<Button onclick={() => goto('/forgot-password')}>
					Request New Link
				</Button>
			</div>
		{:else if actionData?.success}
			<div class="text-center flex flex-col items-center gap-4">
				<BadgeCheckIcon class="size-12" />
				<h1 class="text-2xl font-bold">Password Reset!</h1>
				<p class="text-muted-foreground">
					Your password has been successfully reset.
				</p>
				<Button onclick={() => goto('/login')}>Go to Login</Button>
			</div>
		{:else}
			<h1 class="text-2xl font-bold text-center">Reset Password</h1>
			<p class="text-muted-foreground text-center">
				Enter your new password below.
			</p>

			{#if actionData?.error}
				<p class="text-red-600 text-center">{actionData.error}</p>
			{/if}

			<form method="POST" use:enhance class="space-y-4">
				<input type="hidden" name="token" bind:value={$formData.token} />
				<Field {form} name="password">
					<Control>
						{#snippet children({ props })}
							<FormLabel>New Password</FormLabel>
							<Input
								{...props}
								type="password"
								bind:value={$formData.password}
							/>
						{/snippet}
					</Control>
					<FieldErrors />
				</Field>
				<Field {form} name="confirmPassword">
					<Control>
						{#snippet children({ props })}
							<FormLabel>Confirm New Password</FormLabel>
							<Input
								{...props}
								type="password"
								bind:value={$formData.confirmPassword}
							/>
						{/snippet}
					</Control>
					<FieldErrors />
				</Field>
				<Button type="submit" class="w-full">Reset Password</Button>
			</form>
		{/if}
	</div>
</div>
