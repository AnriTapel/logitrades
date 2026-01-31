<script lang="ts">
	import '../app.pcss';
	import ErrorDialog from '$lib/layouts/error-dialog.svelte';
	import { setAuth, clearAuth } from '$lib/stores/auth';
	import { tradesStore } from '$lib/stores/trades';
	import TopBar from '$lib/layouts/top-bar.svelte';
	import type { Trade } from '$lib/types';

	let { children, data } = $props();

	$effect(() => {
		if (data.isAuthenticated && data.user) {
			setAuth(data.user);
		} else {
			clearAuth();
		}
	});

	$effect(() => {
		const trades = (data as typeof data & { trades?: Trade[] }).trades;
		if (trades) {
			tradesStore.set(trades);
		}
	});
</script>

<main class="container mx-auto p-4">
	<TopBar />
	{@render children()}
	<ErrorDialog />
</main>

<style>
	:global(input[type='number']) {
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			appearance: none;
		}
	}
</style>
