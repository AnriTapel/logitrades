<script lang="ts">
	import type { RankedGroup } from '$lib/coachingCalcs';
	import { formatIntToCurrency } from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { getFinancialColor } from '$lib/utils';

	const {
		rows,
		emptyLabel = 'Need ≥ 5 trades per group',
	}: {
		rows: RankedGroup[];
		emptyLabel?: string;
	} = $props();
</script>

{#if rows.length === 0}
	<div class="w-full py-8 flex justify-center items-center">
		<span class="text-sm text-slate-400">{emptyLabel}</span>
	</div>
{:else}
	<div class="w-full h-auto max-h-[310px] overflow-auto min-h-0 sm:h-[310px]">
		<table class="w-full text-sm">
			<thead class="sticky top-0 bg-white">
				<tr class="border-b border-slate-200">
					<th class="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
					<th class="text-right py-2 px-3 font-semibold text-slate-600">#</th>
					<th class="text-right py-2 px-3 font-semibold text-slate-600"
						>Expectancy</th
					>
					<th class="text-right py-2 px-3 font-semibold text-slate-600">PnL</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.key)}
					<tr
						class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
					>
						<td class="py-2 px-3 font-medium text-slate-800">{row.key}</td>
						<td class="py-2 px-3 text-right text-slate-600">{row.n}</td>
						<td
							class="py-2 px-3 text-right {getFinancialColor(
								row.expectancy,
								0,
							)}"
							>{formatIntToCurrency(row.expectancy, $localeStore.currency)}</td
						>
						<td class="py-2 px-3 text-right {getFinancialColor(row.pnl, 0)}"
							>{formatIntToCurrency(row.pnl, $localeStore.currency)}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
