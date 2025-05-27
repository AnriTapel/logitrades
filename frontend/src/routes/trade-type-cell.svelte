<script lang="ts">
	import type { TradeType } from '$lib/types';

	export let tradeType: TradeType;
</script>

<span
	class="capitalize {tradeType === 'buy' ? 'text-green-500' : 'text-red-500'}"
>
	{tradeType}
</span>
