<script lang="ts">
	import { formatTradeDateTimeLocal } from '$lib/dates';
	import {
		formatIntToCurrency,
		formatNumber,
		formatNumberPercentage,
	} from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { cn, getFinancialColor } from '$lib/utils';
	import SectionCard from './section-card.svelte';

	const {
		label,
		value,
		type = 'string',
		bordered = true,
		className = '',
		baselineValue,
	}: {
		label: string;
		value: string | number;
		type?: 'money' | 'percentage' | 'integer' | 'string' | 'date';
		bordered?: boolean;
		className?: string;
		baselineValue?: number;
	} = $props();

	const numValue = $derived(Number(value));

	const data = $derived(() => {
		if (type === 'money') {
			return formatIntToCurrency(numValue, $localeStore.currency);
		} else if (type === 'percentage') {
			return formatNumberPercentage(numValue);
		} else if (type === 'integer') {
			return formatNumber(Math.round(numValue));
		} else if (type === 'date') {
			return formatTradeDateTimeLocal(value as string);
		} else {
			return value.toString();
		}
	});

	const colorClass = $derived(() => {
		if (
			baselineValue !== undefined &&
			(type === 'money' || type === 'percentage')
		) {
			return getFinancialColor(numValue, baselineValue);
		}
		return '';
	});
</script>

{#if bordered}
	<SectionCard
		title={label}
		contentClass="flex justify-center items-center flex-1 px-4 pb-0 rounded"
	>
		<div
			class="bg-gray-100 rounded flex-1 w-full h-full flex items-center justify-center"
		>
			<span class={cn('text-xl font-semibold', colorClass())}>{data()}</span>
		</div>
	</SectionCard>
{:else}
	<div class={className}>
		<p class="text-l font-bold text-gray-500">{label}</p>
		<div class="pt-2">
			<span class={cn('text-xl font-semibold', colorClass())}>{data()}</span>
		</div>
	</div>
{/if}
