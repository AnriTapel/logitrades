<script lang="ts">
	import { formatIntToCurrency } from '$lib/formatters';

	const {
		takeProfit,
		stopLoss,
	}: {
		takeProfit: number | null;
		stopLoss: number | null;
	} = $props();

	const takeProfitDisplay = $derived(
		takeProfit ? formatIntToCurrency(takeProfit) : '-'
	);
	const stopLossDisplay = $derived(
		stopLoss ? formatIntToCurrency(stopLoss) : '-'
	);
</script>

<div class="flex flex-col gap-1 w-[120px]">
	<p class="text-green-600">TP: {takeProfitDisplay}</p>
	<p class="text-red-600">SL: {stopLossDisplay}</p>
</div>
