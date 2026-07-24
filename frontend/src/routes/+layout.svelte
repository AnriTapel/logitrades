<script lang="ts">
	import '../app.css';
	import ErrorDialog from '$lib/layouts/error-dialog.svelte';
	import { setAuth, clearAuth } from '$lib/stores/auth';
	import {
		resolveActivePortfolioId,
		setActivePortfolioId,
		syncActivePortfolioFromServer,
	} from '$lib/stores/active-portfolio';
	import { setLocaleCurrency } from '$lib/stores/locale';
	import { effectiveCurrency } from '$lib/portfolio/effectiveCurrency';
	import { DEFAULT_CURRENCY } from '$lib/constants/currencies';
	import { invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import Sidebar from '$lib/layouts/sidebar.svelte';
	import NavBar from '$lib/layouts/nav-bar.svelte';

	let { children, data } = $props();

	$effect(() => {
		if (data.isAuthenticated && data.user) {
			setAuth(data.user);
		} else {
			clearAuth();
		}
	});

	// Seed display currency from backend (active portfolio wins)
	$effect(() => {
		const portfolios = data.portfolios ?? [];
		const activeId = data.activePortfolioId;
		const activePortfolio =
			activeId != null
				? (portfolios.find((p) => p.id === activeId) ?? null)
				: null;
		setLocaleCurrency(
			effectiveCurrency({
				userCurrency: data.user?.currency ?? DEFAULT_CURRENCY,
				activePortfolio,
			}),
		);
	});

	// Keep client store aligned with SSR cookie resolution. If only localStorage
	// has a portfolio (cookie missing), promote it and refresh server loads.
	$effect(() => {
		if (!browser || !data.portfolios?.length) return;

		if (data.activePortfolioId != null) {
			syncActivePortfolioFromServer(data.activePortfolioId);
			return;
		}

		const fromStorage = resolveActivePortfolioId(data.portfolios);
		if (fromStorage != null) {
			setActivePortfolioId(fromStorage);
			void invalidateAll();
		}
	});
</script>

<svelte:head>
	<!-- Favicon -->
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="alternate icon" href="/favicon.svg" />
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
	<meta name="theme-color" content="#246aac" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://logitrades.com/" />
	<meta
		property="og:title"
		content="LogiTrades - Trading Journal & Analytics Platform"
	/>
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
	<meta
		name="twitter:title"
		content="LogiTrades - Trading Journal & Analytics Platform"
	/>
	<meta
		name="twitter:description"
		content="Track your trades, analyze performance, and improve your trading discipline with powerful insights and statistics."
	/>
	<meta
		name="twitter:image"
		content="https://logitrades.com/twitter-image.png"
	/>

	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<meta name="language" content="English" />
	<meta name="revisit-after" content="7 days" />
	<link rel="canonical" href="https://logitrades.com/" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{#if data.showAppChrome}
	{#if data.isAuthenticated && data.user}
		<div class="flex min-h-screen bg-[#f9f9fd]">
			<Sidebar />
			<div class="flex flex-col flex-1 min-w-0">
				<NavBar userState={data.user} />
				<main class="flex-1">
					<div class="mx-auto max-w-[1600px] p-4 sm:p-8 flex flex-col gap-8">
						{@render children()}
					</div>
				</main>
				<ErrorDialog />
			</div>
		</div>
	{:else}
		<div class="flex flex-col min-h-screen">
			<NavBar userState={null} />
			<main class="flex-1 container mx-auto p-4">
				{@render children()}
				<ErrorDialog />
			</main>
		</div>
	{/if}
{:else}
	<main class="min-h-screen">
		{@render children()}
		<ErrorDialog />
	</main>
{/if}

<style>
	:global(input[type='number']) {
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			appearance: none;
		}
	}
</style>
