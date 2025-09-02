<script lang="ts">
	import type { Trade } from '$lib/types';
	import { formatIntToCurrency } from '$lib/formatters';

	const { trade } = $props<{ trade: Trade }>();

	const pnl = $derived(calculatePnL(trade));

	function calculatePnL(trade: Trade) {
		if (!trade.closePrice) return null;

		const priceDiff =
			trade.tradeType === 'buy'
				? trade.closePrice - trade.openPrice
				: trade.openPrice - trade.closePrice;

		const pnlDollar = priceDiff * trade.quantity;
		const pnlPercent = (priceDiff / trade.openPrice) * 100;

		return { dollar: pnlDollar, percent: pnlPercent };
	}
</script>

<div class="w-[100px] flex flex-col gap-1 items-end">
	{#if pnl}
		<span
			class="font-medium {pnl.dollar >= 0 ? 'text-green-600' : 'text-red-600'}"
		>
			{pnl.dollar >= 0 ? '+' : ''}{formatIntToCurrency(pnl.dollar)}
		</span>
		<span
			class="font-medium {pnl.percent >= 0 ? 'text-green-600' : 'text-red-600'}"
		>
			({pnl.percent >= 0 ? '+' : ''}{pnl.percent.toFixed(2)}%)
		</span>
	{:else}
		<span class="text-gray-500">-</span>
	{/if}
</div>
