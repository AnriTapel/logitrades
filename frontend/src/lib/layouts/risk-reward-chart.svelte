<script lang="ts">
	import { createRiskRewardDistribution } from '$lib/chartsHelpers';
	import { EmptyState } from '$lib/components/custom';
	import BarChart from '$lib/components/custom/charts/bar-chart.svelte';
	import type { Trade } from '$lib/types';

	let { closedTrades }: { closedTrades: Trade[] } = $props();

	const filteredTrades = $derived(
		closedTrades.filter((trade) => trade.takeProfit && trade.stopLoss)
	);
</script>

{#if closedTrades.length}
	<BarChart
		data={createRiskRewardDistribution(filteredTrades)}
		financialMode={false}
		showLegend={false}
	/>
{:else if closedTrades.length}
	<EmptyState message="Closed trades have no take profit and stop loss" />
{:else}
	<EmptyState message="Close a trade to see risk/reward distribution" />
{/if}
