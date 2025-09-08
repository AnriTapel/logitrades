<script lang="ts">
	import type { Trade } from '$lib/types';
	import { formatIntToCurrency } from '$lib/formatters';
	import { calcAbsolutePnl, calcPnlPercentage } from '$lib/calcFunctions';

	const { trade }: { trade: Trade } = $props();

	const pnlAbsolute = calcAbsolutePnl(trade);
	const pnlPercent = calcPnlPercentage(trade);
</script>

<div class="w-[100px] flex flex-col gap-1 items-end">
	{#if pnlAbsolute && pnlPercent}
		<span
			class="font-medium {pnlAbsolute >= 0 ? 'text-green-600' : 'text-red-600'}"
		>
			{pnlAbsolute >= 0 ? '+' : ''}{formatIntToCurrency(pnlAbsolute)}
		</span>
		<span
			class="font-medium {pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}"
		>
			({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
		</span>
	{:else}
		<span class="text-gray-500">-</span>
	{/if}
</div>
