<script lang="ts">
	import type { TradeType } from '$lib/types';

	const {tradeType}: {tradeType: TradeType} = $props();
</script>

<span
	class="capitalize {tradeType === 'buy' ? 'text-green-500' : 'text-red-500'}"
>
	{tradeType}
</span>
