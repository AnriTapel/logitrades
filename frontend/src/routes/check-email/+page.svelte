<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import type { ActionData } from './$types';
	import CheckEmailMessage from '$lib/layouts/check-email-message.svelte';

	let { form }: { form: ActionData } = $props();

	let isResending = $state(false);

	async function handleResend() {
		isResending = true;

		await fetch('?/resend', {
			method: 'POST',
		});

		isResending = false;
	}
</script>

<svelte:head>
	<title>Check Your Email - Verify Your Account | LogiTrades</title>
</svelte:head>

<div class="flex items-center justify-center grow">
	<div
		class="w-full max-w-md p-8 space-y-6 text-center flex flex-col items-center"
	>
		<CheckEmailMessage
			message="We've sent a verification link to your email address. Please check your inbox and click the link to verify your account."
		/>

		{#if form?.success}
			<p class="text-green-600 font-medium">✓ Verification email sent!</p>
		{:else if form?.error}
			<p class="text-red-600">{form.error}</p>
		{/if}

		<div class="flex flex-col gap-3 pt-4">
			<Button
				variant="outline"
				onclick={handleResend}
				disabled={isResending || form?.success}
			>
				{isResending ? 'Sending...' : 'Resend Verification Email'}
			</Button>
			<Button variant="ghost" onclick={() => goto('/login')}
				>Back to Login</Button
			>
		</div>
	</div>
</div>
