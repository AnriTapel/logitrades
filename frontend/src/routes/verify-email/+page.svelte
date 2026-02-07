<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';

	export let data: {
		status: 'success' | 'error' | 'no_token';
		error?: string;
	};
</script>

<svelte:head>
	<title>Email Verification | LogiTrades</title>
</svelte:head>

<div class="flex items-center justify-center grow">
	<div class="w-full max-w-md p-8 space-y-6 text-center">
		<div class="flex flex-col items-center gap-4">
			{#if data.status === 'success'}
				<BadgeCheckIcon class="size-12" />
				<h1 class="text-2xl font-bold">Email Verified!</h1>
				<p class="text-muted-foreground">
					Your email has been verified successfully. You can now access all
					features.
				</p>
				<Button onclick={() => goto('/')}>Go to Dashboard</Button>
			{:else if data.status === 'error'}
				<CircleXIcon class="size-12" />
				<h1 class="text-2xl font-bold">Verification Failed</h1>
				<p class="text-muted-foreground">{data.error}</p>
				<Button onclick={() => goto('/login')}>Back to Login</Button>
			{:else}
				<CircleSlashIcon class="size-12" />
				<h1 class="text-2xl font-bold">Invalid Link</h1>
				<p class="text-muted-foreground">
					This verification link is invalid or missing a token.
				</p>
				<Button onclick={() => goto('/login')}>Back to Login</Button>
			{/if}
		</div>
	</div>
</div>
