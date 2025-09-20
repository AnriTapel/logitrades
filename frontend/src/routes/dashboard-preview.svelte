<script lang="ts">
	import { ValueStat } from '$lib/components/custom';

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
		createSymbolDistributionData,
	} from '$lib/chartsHelpers';
</script>

<section class="mb-12">
	<h1 class="text-2xl font-bold mb-4">Stats overview</h1>

	<div class="flex w-full h-[334px]">
		{#if $tradesStore.length}
			<div class="grid grid-cols-[min-content_min-content] gap-4">
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

			<div class="flex gap-4 grow pl-4">
				<div class="p-4 border rounded-lg shadow-sm min-w-[200px] w-full">
					<p class="text-l font-bold mb-4">Equity Curve & Drawdown</p>
					<LineChart data={createEquityCurveData($tradesStore)} height={260} />
				</div>

				<div class="p-4 border rounded-lg shadow-sm min-w-[200px] w-full">
					<p class="text-l font-bold mb-4">Trade Pair Distribution</p>
					<PieChart
						data={createSymbolDistributionData($tradesStore)}
						height={260}
					/>
				</div>
			</div>
		{/if}
	</div>
</section>
