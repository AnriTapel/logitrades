<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		pnlForPeriod,
		totalTradedVolumeForPeriod,
		totalEquityInOpenedTrades,
		calcAbsolutePnl,
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
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { goto } from '$app/navigation';
	import { Menu } from 'lucide-svelte';

	let pnlLast7Days: number = $state(0);
	let volumeLast7Days: number = $state(0);
	let equityInOpenTrades: number = $state(0);
	let totalPnL: number = $state(0);
	let mobileMenuOpen: boolean = $state(false);

	let userState = $state<User | null>(null);

	const unsubscribeAuth = userStore.subscribe((user) => {
		userState = user;
	});

	const unsubscribeTrades = tradesStore.subscribe((trades) => {
		const pivotDate = new Date();
		pivotDate.setDate(pivotDate.getDate() - 7);

		const last7DaysTrades = trades.filter(
			(trade) => new Date(trade.openedAt) >= pivotDate,
		);

		totalPnL = trades.reduce((acc, trade) => {
			return acc + (calcAbsolutePnl(trade) ?? 0);
		}, 0);

		pnlLast7Days = pnlForPeriod(last7DaysTrades);
		volumeLast7Days = totalTradedVolumeForPeriod(last7DaysTrades);

		const openTrades = trades.filter((trade) => !trade.closePrice);
		equityInOpenTrades = totalEquityInOpenedTrades(openTrades);
	});

	onDestroy(() => {
		unsubscribeTrades();
		unsubscribeAuth();
	});

	function handleDashboardNavigation() {
		mobileMenuOpen = false;
		goto('/dashboard');
	}
</script>

<div class="flex justify-between items-center w-full">
	<!-- Logo - Always visible -->
	<a href="/" class="flex items-center gap-2 sm:gap-3 shrink-0">
		<img src="/logo.svg" alt="LogiTrades" class="h-10 w-10 sm:h-14 sm:w-14" />
		<h1 class="text-lg sm:text-2xl font-bold">LogiTrades</h1>
	</a>

	{#if userState}
		<!-- Stats - Hidden on mobile/tablet, visible on laptop+ -->
		<div
			class="hidden lg:flex gap-6 xl:gap-12 items-center mx-4 flex-1 justify-center"
		>
			<div>
				<div class="text-xs xl:text-sm text-muted-foreground">Open Equity</div>
				<div class="text-sm xl:text-lg font-semibold">
					{formatIntToCurrency(equityInOpenTrades)}
				</div>
			</div>
			<div>
				<div class="text-xs xl:text-sm text-muted-foreground">7-Day Volume</div>
				<div class="text-sm xl:text-lg font-semibold">
					{formatIntToCurrency(volumeLast7Days)}
				</div>
			</div>
			<div>
				<div class="text-xs xl:text-sm text-muted-foreground">7-Day PnL</div>
				<div
					class="text-sm xl:text-lg font-semibold"
					class:text-green-600={pnlLast7Days > 0}
					class:text-red-600={pnlLast7Days < 0}
				>
					{formatIntToCurrency(pnlLast7Days)}
				</div>
			</div>
			<div>
				<div class="text-xs xl:text-sm text-muted-foreground">Total PnL</div>
				<div
					class="text-sm xl:text-lg font-semibold"
					class:text-green-600={totalPnL > 0}
					class:text-red-600={totalPnL < 0}
				>
					{formatIntToCurrency(totalPnL)}
				</div>
			</div>
			<Button
				variant="link"
				class="text-sm xl:text-base"
				onclick={() => goto('/dashboard')}
			>
				View More Stats
			</Button>
		</div>

		<!-- Right section: User dropdown + Mobile menu -->
		<div class="flex items-center gap-2 shrink-0">
			<!-- User dropdown - Hidden on mobile, visible on tablet+ -->
			<div class="hidden md:block">
				<DropdownMenuRoot>
					<DropdownMenuTrigger>
						<Button variant="outline" class="rounded-full h-10 w-10 p-0">
							<span class="text-base font-semibold"
								>{userState.username.charAt(0).toUpperCase()}</span
							>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>{userState.username}</DropdownMenuLabel>
						<DropdownMenuItem>
							<form action="/?/logout" method="POST">
								<Button type="submit" variant="link" class="p-0 h-auto">
									Logout
								</Button>
							</form>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenuRoot>
			</div>

			<!-- Mobile hamburger menu - visible on mobile/tablet, hidden on desktop -->
			<Sheet bind:open={mobileMenuOpen}>
				<SheetTrigger>
					<Button variant="outline" size="icon" class="lg:hidden">
						<Menu class="h-5 w-5" />
						<span class="sr-only">Open menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="right" class="w-[300px] sm:w-[350px]">
					<div class="mt-6 space-y-6 px-4">
						<!-- User info section -->
						<div class="pb-4 border-b">
							<div class="flex items-center gap-3">
								<div
									class="rounded-full bg-primary text-primary-foreground h-12 w-12 flex items-center justify-center text-lg font-semibold"
								>
									{userState.username.charAt(0).toUpperCase()}
								</div>
								<div class="flex-1">
									<div class="font-semibold text-base">
										{userState.username}
									</div>
									<form action="/?/logout" method="POST" class="mt-1">
										<Button
											type="submit"
											variant="link"
											class="p-0 h-auto text-sm text-muted-foreground"
										>
											Logout
										</Button>
									</form>
								</div>
							</div>
						</div>

						<!-- Stats cards -->
						<div class="space-y-3">
							<div class="p-4 bg-muted/50 rounded-lg border">
								<div class="text-sm text-muted-foreground">Open Equity</div>
								<div class="text-xl font-semibold mt-1">
									{formatIntToCurrency(equityInOpenTrades)}
								</div>
							</div>
							<div class="p-4 bg-muted/50 rounded-lg border">
								<div class="text-sm text-muted-foreground">7-Day Volume</div>
								<div class="text-xl font-semibold mt-1">
									{formatIntToCurrency(volumeLast7Days)}
								</div>
							</div>
							<div class="p-4 bg-muted/50 rounded-lg border">
								<div class="text-sm text-muted-foreground">7-Day PnL</div>
								<div
									class="text-xl font-semibold mt-1"
									class:text-green-600={pnlLast7Days > 0}
									class:text-red-600={pnlLast7Days < 0}
								>
									{formatIntToCurrency(pnlLast7Days)}
								</div>
							</div>
							<div class="p-4 bg-muted/50 rounded-lg border">
								<div class="text-sm text-muted-foreground">Total PnL</div>
								<div
									class="text-xl font-semibold mt-1"
									class:text-green-600={totalPnL > 0}
									class:text-red-600={totalPnL < 0}
								>
									{formatIntToCurrency(totalPnL)}
								</div>
							</div>
						</div>

						<!-- Action button -->
						<Button
							variant="default"
							class="w-full"
							onclick={handleDashboardNavigation}
						>
							View More Stats
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	{:else}
		<!-- Login button for non-authenticated users -->
		<a href="/login" class="shrink-0">
			<Button variant="outline" class="text-sm sm:text-base">Login</Button>
		</a>
	{/if}
</div>
