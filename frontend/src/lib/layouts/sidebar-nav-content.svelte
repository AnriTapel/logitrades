<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import CurrencyCombobox from '$lib/components/custom/currency-combobox.svelte';
	import { cn } from '$lib/utils';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import LayoutGrid from 'lucide-svelte/icons/layout-grid';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Briefcase from 'lucide-svelte/icons/briefcase';
	import { setActivePortfolioId } from '$lib/stores/active-portfolio';
	import type { Portfolio } from '$lib/types';
	import { Root, Trigger, Item, Content } from '$lib/components/ui/select';

	const currentYear = new Date().getFullYear();

	const {
		onNavigate,
		showLogout = false,
		portfolios = [],
		activePortfolioId = null,
		plan = 'free',
		class: className = '',
	}: {
		onNavigate?: () => void;
		showLogout?: boolean;
		portfolios?: Portfolio[];
		activePortfolioId?: number | null;
		plan?: string;
		class?: string;
	} = $props();

	const pathname = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	function handleNavClick() {
		onNavigate?.();
	}

	function handleAddTrade() {
		onNavigate?.();
		goto('/journal?add=true');
	}

	const activePortfolio = $derived(
		portfolios.find((p) => p.id === activePortfolioId) ?? null,
	);

	const selectedPortfolioValue = $derived(
		activePortfolioId != null ? String(activePortfolioId) : undefined,
	);

	async function handlePortfolioChange(value: string | null) {
		if (!value) return;
		const id = parseInt(value, 10);
		if (!isNaN(id)) {
			setActivePortfolioId(id);
			await invalidateAll();
		}
	}

	const isPro = $derived(plan === 'pro' || plan === 'max');
</script>

<div class={cn('flex flex-col flex-1 min-h-0', className)}>
	{#if portfolios.length > 1}
		<div class="mb-4">
			<p
				class="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94a3b8] px-1 mb-1.5"
			>
				Portfolio
			</p>
			<Root
				type="single"
				value={selectedPortfolioValue}
				onValueChange={handlePortfolioChange}
			>
				<Trigger
					class="w-full border-[#e2e8f0] bg-white px-2 py-1.5 text-sm text-[#1a1c1f] shadow-none"
					placeholder="Select a portfolio"
				>
					<span>{activePortfolio?.name ?? 'Select a portfolio'}</span>
				</Trigger>
				<Content>
					{#each portfolios as portfolio (portfolio.id)}
						{@const label =
							portfolio.status === 'archived'
								? `${portfolio.name} [Archived]`
								: portfolio.name}
						<Item value={String(portfolio.id)} {label}>
							{label}
						</Item>
					{/each}
				</Content>
			</Root>
			{#if activePortfolio?.status === 'archived'}
				<p class="mt-1 px-1 text-[10px] text-amber-600 font-medium">
					Archived — read-only
				</p>
			{/if}
		</div>
	{/if}

	<nav class="flex flex-col gap-1 flex-1">
		<a
			href="/journal"
			onclick={handleNavClick}
			class={cn(
				'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors',
				isActive('/journal')
					? 'bg-white text-[#0369a1] shadow-sm'
					: 'text-[#64748b] hover:text-foreground',
			)}
		>
			<BookOpen class="size-4 shrink-0" />
			Trades
		</a>
		<a
			href="/dashboard"
			onclick={handleNavClick}
			class={cn(
				'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors',
				isActive('/dashboard')
					? 'bg-white text-[#0369a1] shadow-sm'
					: 'text-[#64748b] hover:text-foreground',
			)}
		>
			<LayoutGrid class="size-4 shrink-0" />
			Dashboard
		</a>
		<!-- Portfolios link: shown for all authenticated users -->
		<a
			href="/portfolios"
			onclick={handleNavClick}
			class={cn(
				'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors',
				isActive('/portfolios')
					? 'bg-white text-[#0369a1] shadow-sm'
					: 'text-[#64748b] hover:text-foreground',
			)}
		>
			<Briefcase class="size-4 shrink-0" />
			Portfolios
			{#if !isPro}
				<span
					class="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]"
				>
					Free
				</span>
			{/if}
		</a>
	</nav>

	<div class="border-t border-[#e2e8f0] pt-4 mt-4 space-y-3 shrink-0">
		<Button
			class="w-full bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
			onclick={handleAddTrade}
		>
			Add Trade
		</Button>

		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground shrink-0">Currency:</span>
			<CurrencyCombobox />
		</div>

		{#if showLogout}
			<form action="/?/logout" method="POST">
				<Button
					type="submit"
					variant="ghost"
					class="w-full justify-start gap-3 px-3 text-[#64748b] hover:text-foreground"
				>
					<LogOut class="size-4 shrink-0" />
					Log Out
				</Button>
			</form>
		{/if}

		<p class="text-xs text-muted-foreground px-1">
			&copy; 2025 – {currentYear} LogiTrades<br />All rights reserved.
		</p>
	</div>
</div>
