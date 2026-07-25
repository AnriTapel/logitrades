<script lang="ts">
	import SidebarNavContent from './sidebar-nav-content.svelte';
	import { page } from '$app/state';
	import { activePortfolioId } from '$lib/stores/active-portfolio';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import PanelLeftClose from 'lucide-svelte/icons/panel-left-close';
	import PanelLeftOpen from 'lucide-svelte/icons/panel-left-open';

	const portfolios = $derived(page.data.portfolios ?? []);
	const plan = $derived(page.data.user?.plan ?? 'free');
	const resolvedActiveId = $derived(
		$activePortfolioId ?? page.data.activePortfolioId ?? null,
	);

	let collapsed = $state(false);

	function toggleCollapsed() {
		collapsed = !collapsed;
	}
</script>

<aside
	class={cn(
		'hidden lg:flex sticky top-0 h-screen shrink-0 flex-col border-r border-[#e2e8f0] bg-[#f8fafc] py-4 overflow-y-auto transition-[width]',
		collapsed ? 'w-[4.5rem] px-2' : 'w-64 px-4',
	)}
>
	<div
		class={cn(
			'shrink-0 mb-8',
			collapsed
				? 'flex flex-col items-center gap-2'
				: 'flex items-center gap-2',
		)}
	>
		<a
			href="/journal"
			class={cn(
				'flex items-center gap-2 min-w-0',
				collapsed ? 'justify-center' : 'flex-1',
			)}
		>
			<img src="/logo.svg" alt="LogiTrades" class="h-12 w-12 shrink-0" />
			{#if !collapsed}
				<span class="font-bold text-[#24567f] text-2xl tracking-tight"
					>LogiTrades</span
				>
			{/if}
		</a>
	</div>

	<Button
		variant="ghost"
		size="icon"
		class={cn(
			'shrink-0 text-[#64748b] hover:text-foreground mb-8',
			!collapsed ? 'ml-auto' : 'mx-auto',
		)}
		onclick={toggleCollapsed}
		aria-expanded={!collapsed}
		aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
	>
		{#if collapsed}
			<PanelLeftOpen class="size-4" />
		{:else}
			<PanelLeftClose class="size-4" />
		{/if}
	</Button>

	<SidebarNavContent
		{portfolios}
		activePortfolioId={resolvedActiveId}
		{plan}
		{collapsed}
	/>
</aside>
