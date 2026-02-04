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

<svelte:head>
	<!-- Primary Meta Tags -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta
		name="description"
		content="LogiTrades is a comprehensive trading journal and analytics platform. Track your trades, analyze performance, and improve your trading discipline with powerful insights and statistics."
	/>
	<meta
		name="keywords"
		content="trading journal, trade tracker, trading analytics, trading performance, trading statistics, trade log, trading discipline, stock trading, forex trading, crypto trading, trading insights, portfolio tracking"
	/>
	<meta name="author" content="LogiTrades" />
	<meta name="application-name" content="LogiTrades" />
	<meta name="theme-color" content="#000000" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://logitrades.com/" />
	<meta property="og:title" content="LogiTrades - Trading Journal & Analytics Platform" />
	<meta
		property="og:description"
		content="Track your trades, analyze performance, and improve your trading discipline with powerful insights and statistics."
	/>
	<meta property="og:image" content="https://logitrades.com/og-image.png" />
	<meta property="og:site_name" content="LogiTrades" />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://logitrades.com/" />
	<meta name="twitter:title" content="LogiTrades - Trading Journal & Analytics Platform" />
	<meta
		name="twitter:description"
		content="Track your trades, analyze performance, and improve your trading discipline with powerful insights and statistics."
	/>
	<meta name="twitter:image" content="https://logitrades.com/twitter-image.png" />

	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<meta name="language" content="English" />
	<meta name="revisit-after" content="7 days" />
	<link rel="canonical" href="https://logitrades.com/" />
</svelte:head>

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
