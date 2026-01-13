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
		takeProfit ? formatIntToCurrency(takeProfit, 6) : '-'
	);
	const stopLossDisplay = $derived(
		stopLoss ? formatIntToCurrency(stopLoss, 6) : '-'
	);
</script>

<div class="flex flex-col gap-1 w-[120px]">
	<p class="text-green-600">{takeProfitDisplay}</p>
	<p class="text-red-600">{stopLossDisplay}</p>
</div>
