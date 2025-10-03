<script lang="ts">
	import { BarChart, ValueStat } from '$lib/components/custom';

	import { tradesStore } from '$lib/stores/trades';
	import {
		calcAverageLoss,
		calcAverageWin,
		calcProfitFactor,
		calcWinrate,
	} from '$lib/calcFunctions';
	import LineChart from '$lib/components/custom/charts/line-chart.svelte';
	import PieChart from '$lib/components/custom/charts/pie-chart.svelte';
	import {
		createEquityCurveData,
		createMonthlyPnLData,
		createRiskRewardDistribution,
		createSymbolDistributionData,
		createTradeTypeDistributionData,
	} from '$lib/chartsHelpers';
</script>

<section class="mb-12">
	<h1 class="text-2xl font-bold mb-4">Stats dashboard</h1>

	{#if $tradesStore.length}
		<div class="grid grid-cols-3 gap-4 grid-rows-2 mb-4">
			<div class="grid grid-cols-2 gap-4">
				<ValueStat
					label="Winrate"
					value={calcWinrate($tradesStore)}
					type={'percentage'}
				/>

				<ValueStat
					label="Average Win"
					value={calcAverageWin($tradesStore)}
					type={'money'}
				/>

				<ValueStat
					label="Average Loss"
					value={calcAverageLoss($tradesStore)}
					type={'money'}
				/>

				<ValueStat
					label="Profit Factor"
					value={calcProfitFactor($tradesStore)}
					type={'percentage'}
				/>
			</div>

			<div class="p-4 border rounded-lg shadow-sm w-full">
				<p class="text-l font-bold mb-4">Equity Curve & Drawdown</p>
				<LineChart data={createEquityCurveData($tradesStore)} />
			</div>

			<div class="p-4 border rounded-lg shadow-sm w-full">
				<p class="text-l font-bold mb-4">Trade Pair Distribution</p>
				<PieChart
					data={createSymbolDistributionData($tradesStore)}
					height={260}
				/>
			</div>

			<div class="p-4 border grow rounded-lg shadow-sm w-full">
				<p class="text-l font-bold mb-4">Trade Type Distribution</p>
				<PieChart data={createTradeTypeDistributionData($tradesStore)} />
			</div>

			<div class="p-4 border grow rounded-lg shadow-sm w-full">
				<p class="text-l font-bold mb-4">Risk Reward Distribution</p>
				<BarChart data={createRiskRewardDistribution($tradesStore)} />
			</div>

			<div class="p-4 border grow rounded-lg shadow-sm w-full">
				<p class="text-l font-bold mb-4">Monthly PnL</p>
				<BarChart data={createMonthlyPnLData($tradesStore)} />
			</div>
		</div>
	{:else}
		<div
			class="p-4 border rounded-lg shadow-sm h-[30vh] w-full flex items-center justify-center bg-gray-100"
		>
			<p class="text-l font-bold mb-4">
				Create or import your first trade to see stats
			</p>
		</div>
	{/if}
</section>
