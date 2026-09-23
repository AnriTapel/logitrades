<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		formatIntToCurrency,
		formatNumber,
		formatNumberPercentage,
	} from '$lib/formatters';
	import { formatTradeDateTimeLocal, type UtcIsoDateTime } from '$lib/dates';
	import type { DataType } from '$lib/types';

	type TradeFormFieldMode = 'write' | 'read';

	let {
		mode = 'write',
		format = 'string',
		value,
		currency,
		children,
	}: {
		mode?: TradeFormFieldMode;
		format?: DataType;
		value?: string | number | string[] | null;
		currency?: string;
		children?: Snippet;
	} = $props();

	const isEmpty = $derived.by(() => {
		if (value === null || value === undefined) return true;
		if (typeof value === 'string' && value.trim() === '') return true;
		if (Array.isArray(value) && value.length === 0) return true;
		if (typeof value === 'number' && Number.isNaN(value)) return true;
		return false;
	});

	const displayValue = $derived.by(() => {
		if (isEmpty) return '-';

		const numValue = typeof value === 'number' ? value : Number(value);

		switch (format) {
			case 'datetime':
				return formatTradeDateTimeLocal(value as UtcIsoDateTime);
			case 'money':
				return formatIntToCurrency(numValue, currency ?? 'USD', 6);
			case 'number':
				return formatNumber(numValue);
			case 'percentage':
				return formatNumberPercentage(numValue);
			case 'integer':
				return formatNumber(Math.round(numValue));
			case 'decimal':
				return formatNumber(numValue, 2);
			case 'string':
			default:
				if (Array.isArray(value)) return value.join(', ');
				return String(value);
		}
	});
</script>

{#if mode === 'read'}
	<p class="text-sm text-[#1a1c1f]">{displayValue}</p>
{:else}
	{@render children?.()}
{/if}
