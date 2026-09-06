<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import CurrencyCombobox from '$lib/components/custom/currency-combobox.svelte';
	import ConfirmationModal from '$lib/components/custom/confirmation-modal.svelte';
	import { cn } from '$lib/utils';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import LayoutGrid from 'lucide-svelte/icons/layout-grid';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Briefcase from 'lucide-svelte/icons/briefcase';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Plus from 'lucide-svelte/icons/plus';
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
		collapsed = false,
		class: className = '',
	}: {
		onNavigate?: () => void;
		showLogout?: boolean;
		portfolios?: Portfolio[];
		activePortfolioId?: number | null;
		plan?: string;
		collapsed?: boolean;
		class?: string;
	} = $props();

	let logoutConfirmOpen = $state(false);

	const pathname = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	function handleNavClick() {
		onNavigate?.();
	}

	function handleAddTrade() {
		onNavigate?.();
		goto('/trade');
	}

	function handleOpenLogoutConfirm() {
		logoutConfirmOpen = true;
	}

	function handleRejectLogout() {
		logoutConfirmOpen = false;
	}

	function handleConfirmLogout() {
		logoutConfirmOpen = false;
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/?/logout';
		document.body.appendChild(form);
		form.submit();
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
	const currencyDisabled = $derived(
		isPro && activePortfolio?.status === 'archived',
	);

	const navLinkClass = (href: string) =>
		cn(
			'flex items-center rounded text-sm font-medium transition-colors',
			collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
			isActive(href)
				? 'bg-white text-[#0369a1] shadow-sm'
				: 'text-[#64748b] hover:text-foreground',
		);
</script>

<div class={cn('flex flex-col flex-1 min-h-0', className)}>
	{#if !collapsed && portfolios.length > 1}
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

	<nav class="flex flex-col gap-1 flex-1 grow">
		<a
			href="/journal"
			onclick={handleNavClick}
			title="Trades"
			class={navLinkClass('/journal')}
		>
			<BookOpen class="size-4 shrink-0" />
			{#if !collapsed}
				Trades
			{/if}
		</a>
		<a
			href="/dashboard"
			onclick={handleNavClick}
			title="Dashboard"
			class={navLinkClass('/dashboard')}
		>
			<LayoutGrid class="size-4 shrink-0" />
			{#if !collapsed}
				Dashboard
			{/if}
		</a>
		<!-- Portfolios link: shown for all authenticated users -->
		<a
			href="/portfolios"
			onclick={handleNavClick}
			title="Portfolios"
			class={navLinkClass('/portfolios')}
		>
			<Briefcase class="size-4 shrink-0" />
			{#if !collapsed}
				Portfolios
				{#if !isPro}
					<span
						class="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]"
					>
						Free
					</span>
				{/if}
			{/if}
		</a>

		<a
			href="/account"
			onclick={handleNavClick}
			title="Account"
			class={navLinkClass('/account')}
		>
			<CircleUser class="size-4 shrink-0" />
			{#if !collapsed}
				Account
			{/if}
		</a>

		{#if showLogout}
			<Button
				type="button"
				variant="ghost"
				class="mt-auto w-full text-[#64748b] hover:text-foreground justify-start"
				title="Log Out"
				aria-label="Log Out"
				onclick={handleOpenLogoutConfirm}
			>
				<LogOut class="size-4 shrink-0" />
				Log Out
			</Button>
		{/if}
	</nav>

	<div class="border-t border-[#e2e8f0] pt-4 mt-4 space-y-3 shrink-0">
		{#if collapsed}
			<Button
				size="icon"
				class="w-full bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
				onclick={handleAddTrade}
				title="Add Trade"
				aria-label="Add Trade"
			>
				<Plus class="size-4" />
			</Button>
		{:else}
			<Button
				class="w-full bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
				onclick={handleAddTrade}
			>
				Add Trade
			</Button>
		{/if}

		{#if !collapsed}
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground shrink-0">Currency:</span>
				<CurrencyCombobox
					{plan}
					{activePortfolioId}
					disabled={currencyDisabled}
				/>
			</div>
		{/if}

		{#if !collapsed}
			<p class="text-xs text-muted-foreground px-1">
				&copy; 2025 – {currentYear} LogiTrades<br />All rights reserved.
			</p>
		{/if}
	</div>
</div>

{#if showLogout}
	<ConfirmationModal
		open={logoutConfirmOpen}
		title="Log out"
		message="Are you sure you want to log out?"
		confirmButtonText="Log out"
		rejectButtonText="Cancel"
		confirmVariant="default"
		onConfirm={handleConfirmLogout}
		onReject={handleRejectLogout}
	/>
{/if}
