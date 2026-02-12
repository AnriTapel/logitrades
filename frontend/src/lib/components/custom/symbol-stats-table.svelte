<script lang="ts">
	import type { SymbolStatsRow } from '$lib/chartsHelpers';
	import { formatIntToCurrency, formatNumberPercentage } from '$lib/formatters';

	interface Props {
		data: SymbolStatsRow[];
	}

	let { data }: Props = $props();
</script>

<div class="w-full h-auto max-h-[310px] overflow-auto min-h-0 sm:h-[310px]">
	<table class="w-full text-sm">
		<thead class="sticky top-0 bg-white">
			<tr class="border-b border-slate-200">
				<th class="text-left py-2 px-3 font-semibold text-slate-600">Pair</th>
				<th class="text-right py-2 px-3 font-semibold text-slate-600"
					>Notional Volume</th
				>
				<th class="text-right py-2 px-3 font-semibold text-slate-600">PnL</th>
				<th class="text-right py-2 px-3 font-semibold text-slate-600"
					>Winrate</th
				>
			</tr>
		</thead>
		<tbody>
			{#each data as row}
				<tr
					class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
				>
					<td class="py-2 px-3 font-medium text-slate-800">{row.symbol}</td>
					<td class="py-2 px-3 text-right text-slate-600"
						>{formatIntToCurrency(row.notionalVolume)}</td
					>
					<td class="py-2 px-3 text-right">
						<span
							class={row.pnl > 0
								? 'text-green-600'
								: row.pnl < 0
									? 'text-red-600'
									: 'text-gray-500'}
						>
							{formatIntToCurrency(row.pnl)}
						</span>
					</td>
					<td class="py-2 px-3 text-right">
						<span
							class={row.winrate >= 0.5
								? 'text-green-600'
								: row.winrate > 0
									? 'text-red-600'
									: 'text-gray-500'}
						>
							{formatNumberPercentage(row.winrate)}
						</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.length === 0}
		<div class="w-full py-8 flex justify-center items-center">
			<span class="text-sm text-slate-400">No trades yet</span>
		</div>
	{/if}
</div>
