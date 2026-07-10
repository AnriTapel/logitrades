<script lang="ts">
	import { formatIntToCurrency } from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { getFinancialColor, cn } from '$lib/utils';
	import type { TradeSummary } from '$lib/types';

	let { summary }: { summary: TradeSummary } = $props();

	const stats = $derived([
		{
			label: 'Open Equity',
			value: formatIntToCurrency(summary.open_equity, $localeStore.currency),
			colorClass: 'text-[#003d6d]',
		},
		{
			label: '7-Day Volume',
			value: formatIntToCurrency(summary.volume_last_7_days, $localeStore.currency),
			colorClass: 'text-[#1a1c1f]',
		},
		{
			label: '7-Day PnL',
			value: formatIntToCurrency(summary.pnl_last_7_days, $localeStore.currency),
			colorClass: getFinancialColor(summary.pnl_last_7_days, 0),
		},
		{
			label: 'Total PnL',
			value: formatIntToCurrency(summary.total_pnl, $localeStore.currency),
			colorClass: getFinancialColor(summary.total_pnl, 0),
		},
	]);
</script>

<section class="flex flex-col gap-8">
	<div class="flex flex-col gap-1">
		<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
			Your trading stats
		</p>
		<h2 class="text-2xl font-extrabold tracking-tight text-[#1a1c1f]">Summary</h2>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
		{#each stats as stat}
			<div
				class="flex flex-col gap-2 rounded-lg border border-white bg-[#f3f3f7] p-6"
			>
				<p class="text-xs font-bold uppercase tracking-wider text-[#4c6076]">
					{stat.label}
				</p>
				<p class={cn('text-2xl font-bold tracking-tight', stat.colorClass)}>
					{stat.value}
				</p>
			</div>
		{/each}
	</div>
</section>
