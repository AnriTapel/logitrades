<script lang="ts">
	import { createRiskRewardDistribution } from '$lib/chartsHelpers';
	import { EmptyState } from '$lib/components/custom';
	import BarChart from '$lib/components/custom/charts/bar-chart.svelte';
	import type { Trade } from '$lib/types';
	import { Info } from '@lucide/svelte';

	let { closedTrades }: { closedTrades: Trade[] } = $props();

	const filteredTrades = $derived(
		closedTrades.filter((trade) => trade.takeProfit && trade.stopLoss),
	);
	const excludedPct = $derived(
		closedTrades.length === 0
			? 0
			: 1 - filteredTrades.length / closedTrades.length,
	);
</script>

{#if filteredTrades.length}
	<BarChart
		data={createRiskRewardDistribution(filteredTrades)}
		financialMode={false}
		showLegend={false}
	/>
	<div class="flex gap-1 items-start text-xs sm:items-center">
		<Info class="size-6 sm:size-4" />
		<span class="text-slate-500">
			Realized R, SL+TP trades only. {Math.round(excludedPct * 100)}% of the
			book excluded.
		</span>
	</div>
{:else if closedTrades.length}
	<EmptyState message="Closed trades have no take profit and stop loss" />
{:else}
	<EmptyState message="Close a trade to see risk/reward distribution" />
{/if}
