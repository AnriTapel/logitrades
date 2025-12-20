<script lang="ts">
	import type { TradeType } from '$lib/types';

	const { tradeType }: { tradeType: TradeType } = $props();
</script>

<span class={tradeType === 'buy' ? 'text-green-600' : 'text-red-600'}>
	{tradeType === 'buy' ? 'Long' : 'Short'}
</span>
