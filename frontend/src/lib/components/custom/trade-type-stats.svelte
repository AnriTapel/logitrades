<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { TradeTypeStats } from '$lib/chartsHelpers';
	import { formatIntToCurrency } from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { getFinancialColor } from '$lib/utils';

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
			<div class="grid grid-cols-3 gap-2 flex-1">
				<div
					class="bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center"
				>
					<span class="text-xs text-slate-500 mb-1">Trades</span>
					<span class="text-xl font-bold">
						{longStats?.tradeCount ?? 0}
					</span>
				</div>
				<div
					class="bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center"
				>
					<span class="text-xs text-slate-500 mb-1">Winrate</span>
					<span class="text-xl font-bold">
						{(longStats?.winrate ?? 0).toFixed(1)}%
					</span>
				</div>
				<div
					class="bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center"
				>
					<span class="text-xs text-slate-500 mb-1">PnL</span>
					<span
						class="text-lg font-bold {getFinancialColor(longStats?.pnl ?? 0, 0)}"
					>
						{formatIntToCurrency(longStats?.pnl ?? 0, $localeStore.currency)}
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
			<div class="grid grid-cols-3 gap-2 flex-1">
				<div
					class="bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center"
				>
					<span class="text-xs text-slate-500 mb-1">Trades</span>
					<span class="text-xl font-bold">
						{shortStats?.tradeCount ?? 0}
					</span>
				</div>
				<div
					class="bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center"
				>
					<span class="text-xs text-slate-500 mb-1">Winrate</span>
					<span class="text-xl font-bold">
						{(shortStats?.winrate ?? 0).toFixed(1)}%
					</span>
				</div>
				<div
					class="bg-gray-100 rounded-lg p-3 flex flex-col justify-center items-center"
				>
					<span class="text-xs text-slate-500 mb-1">PnL</span>
					<span
						class="text-lg font-bold {getFinancialColor(shortStats?.pnl ?? 0, 0)}"
					>
						{formatIntToCurrency(shortStats?.pnl ?? 0, $localeStore.currency)}
					</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
