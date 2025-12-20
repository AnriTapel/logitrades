<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { TradeTypeStats } from '$lib/chartsHelpers';

	interface Props {
		data: TradeTypeStats[];
	}

	let { data }: Props = $props();

	const longStats = $derived(data.find((d) => d.type === 'long'));
	const shortStats = $derived(data.find((d) => d.type === 'short'));
</script>

<div class="flex flex-col gap-3 h-full">
	<!-- Long Card -->
	<Card.Root class="flex-1 py-3">
		<Card.Content class="h-full flex flex-col gap-2 p-3">
			<div class="flex items-center gap-2">
				<div class="w-2 h-2 rounded-full bg-green-500"></div>
				<span class="text-sm font-semibold text-slate-700">Long</span>
			</div>
			<div class="flex gap-4 flex-1">
				<div class="flex-1 bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center">
					<span class="text-xs text-slate-500 mb-1">Trades</span>
					<span class="text-xl font-bold">
						{longStats?.tradeCount ?? 0}
					</span>
				</div>
				<div class="flex-1 bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center">
					<span class="text-xs text-slate-500 mb-1">Winrate</span>
					<span
						class="text-xl font-bold {(longStats?.winrate ?? 0) >= 50
							? 'text-green-600'
							: (longStats?.winrate ?? 0) > 0
								? 'text-red-600'
								: 'text-gray-500'}"
					>
						{(longStats?.winrate ?? 0).toFixed(1)}%
					</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Short Card -->
	<Card.Root class="flex-1 py-3">
		<Card.Content class="h-full flex flex-col gap-2 p-3">
			<div class="flex items-center gap-2">
				<div class="w-2 h-2 rounded-full bg-red-500"></div>
				<span class="text-sm font-semibold text-slate-700">Short</span>
			</div>
			<div class="flex gap-4 flex-1">
				<div class="flex-1 bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center">
					<span class="text-xs text-slate-500 mb-1">Trades</span>
					<span class="text-xl font-bold">
						{shortStats?.tradeCount ?? 0}
					</span>
				</div>
				<div class="flex-1 bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center">
					<span class="text-xs text-slate-500 mb-1">Winrate</span>
					<span
						class="text-xl font-bold {(shortStats?.winrate ?? 0) >= 50
							? 'text-green-600'
							: (shortStats?.winrate ?? 0) > 0
								? 'text-red-600'
								: 'text-gray-500'}"
					>
						{(shortStats?.winrate ?? 0).toFixed(1)}%
					</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>

