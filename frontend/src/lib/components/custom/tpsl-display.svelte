<script lang="ts">
	import { formatIntToCurrency } from '$lib/formatters';

	const {
		takeProfit,
		stopLoss,
	}: {
		takeProfit: number | null;
		stopLoss: number | null;
	} = $props();

	const takeProfitDisplay = takeProfit ? formatIntToCurrency(takeProfit) : '-';
	const stopLossDisplay = stopLoss ? formatIntToCurrency(stopLoss) : '-';
</script>

<div class="flex flex-col gap-1 w-[120px]">
	<p class="text-green-600">TP: {takeProfitDisplay}</p>
	<p class="text-red-600">SL: {stopLossDisplay}</p>
</div>
