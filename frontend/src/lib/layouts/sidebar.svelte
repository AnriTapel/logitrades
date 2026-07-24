<script lang="ts">
	import SidebarNavContent from './sidebar-nav-content.svelte';
	import { page } from '$app/state';
	import { activePortfolioId } from '$lib/stores/active-portfolio';

	const portfolios = $derived(page.data.portfolios ?? []);
	const plan = $derived(page.data.user?.plan ?? 'free');
	const resolvedActiveId = $derived(
		$activePortfolioId ?? page.data.activePortfolioId ?? null,
	);
</script>

<aside
	class="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 overflow-y-auto"
>
	<a href="/journal" class="flex items-center gap-2 shrink-0 mb-8">
		<img src="/logo.svg" alt="LogiTrades" class="h-12 w-12 shrink-0" />
		<span class="font-bold text-[#24567f] text-2xl tracking-tight">LogiTrades</span>
	</a>

	<SidebarNavContent
		{portfolios}
		activePortfolioId={resolvedActiveId}
		{plan}
	/>
</aside>
