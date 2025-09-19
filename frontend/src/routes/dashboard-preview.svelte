<script lang="ts">
	import type { PageProps } from './$types';
	import { ValueStat } from '$lib/components/custom';

	import { tradesStore } from '$lib/stores/trades';
	import {
		calcAverageLoss,
		calcAverageWin,
		calcProfitFactor,
		calcWinrate,
	} from '$lib/calcFunctions';
</script>

<section>
	<h3 class="text-2xl font-bold mb-4">Overview</h3>

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
	{/if}
</section>
