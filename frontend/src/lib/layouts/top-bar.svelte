<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		pnlForPeriod,
		totalTradedVolumeForPeriod,
		totalEquityInOpenedTrades,
	} from '$lib/calcFunctions';
	import { formatIntToCurrency } from '$lib/formatters';
	import { tradesStore } from '$lib/stores/trades';
	import { onDestroy } from 'svelte';
	import { userStore, type User } from '$lib/stores/auth';
	import {
		Root as DropdownMenuRoot,
		Trigger as DropdownMenuTrigger,
		Content as DropdownMenuContent,
		Item as DropdownMenuItem,
		Label as DropdownMenuLabel,
	} from '$lib/components/ui/dropdown-menu';
	import { goto } from '$app/navigation';

	let pnlLast7Days: number = $state(0);
	let volumeLast7Days: number = $state(0);
	let equityInOpenTrades: number = $state(0);

	let userState = $state<User | null>(null);

	const unsubscribeAuth = userStore.subscribe((user) => {
		userState = user;
	});

	const unsubscribeTrades = tradesStore.subscribe((trades) => {
		const pivotDate = new Date();
		pivotDate.setDate(pivotDate.getDate() - 7);

		const last7DaysTrades = trades.filter(
			(trade) => new Date(trade.openedAt) >= pivotDate
		);

		pnlLast7Days = pnlForPeriod(last7DaysTrades);
		volumeLast7Days = totalTradedVolumeForPeriod(last7DaysTrades);

		const openTrades = trades.filter((trade) => !trade.closePrice);
		equityInOpenTrades = totalEquityInOpenedTrades(openTrades);
	});

	onDestroy(() => {
		unsubscribeTrades();
		unsubscribeAuth();
	});
</script>

<div class="flex justify-between items-center">
	<a href="/" class="flex items-center gap-3">
		<img src="/logo.svg" alt="LogiTrades" class="h-14 w-14" />
		<h1 class="text-2xl font-bold">LogiTrades</h1>
	</a>

	{#if userState}
		<div class="flex gap-12 mt-4 items-bottom">
			<div>
				<div class="text-sm text-gray-500">7-Day PnL</div>
				<div
					class="text-lg font-semibold"
					class:text-green-600={pnlLast7Days > 0}
					class:text-red-600={pnlLast7Days < 0}
				>
					{formatIntToCurrency(pnlLast7Days)}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-500">7-Day Volume</div>
				<div class="text-lg font-semibold">
					{formatIntToCurrency(volumeLast7Days)}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-500">Open Equity</div>
				<div class="text-lg font-semibold">
					{formatIntToCurrency(equityInOpenTrades)}
				</div>
			</div>
			<Button
				variant="link"
				class="text-base"
				onclick={() => goto('/dashboard')}
				>More Stats
			</Button>
		</div>
	{/if}

	{#if userState}
		<DropdownMenuRoot>
			<DropdownMenuTrigger>
				<Button variant="outline" class="rounded-full"
					>{userState.username.charAt(0)}</Button
				>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>{userState.username}</DropdownMenuLabel>
				<DropdownMenuItem>
					<form action="/?/logout" method="POST">
						<Button type="submit" variant="link">Logout</Button>
					</form>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenuRoot>
	{:else}
		<a href="/login">
			<Button variant="outline">Login</Button>
		</a>
	{/if}
</div>
