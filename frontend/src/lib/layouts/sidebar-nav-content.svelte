<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import CurrencyCombobox from '$lib/components/custom/currency-combobox.svelte';
	import { cn } from '$lib/utils';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import LayoutGrid from 'lucide-svelte/icons/layout-grid';
	import LogOut from 'lucide-svelte/icons/log-out';

	const currentYear = new Date().getFullYear();

	const {
		onNavigate,
		showLogout = false,
		class: className = '',
	}: {
		onNavigate?: () => void;
		showLogout?: boolean;
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
</script>

<div class={cn('flex flex-col flex-1 min-h-0', className)}>
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
