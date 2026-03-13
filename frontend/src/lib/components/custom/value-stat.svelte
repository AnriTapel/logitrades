<script lang="ts">
	import {
		formatDateTimeISO,
		formatIntToCurrency,
		formatNumber,
		formatNumberPercentage,
	} from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { cn, getFinancialColor } from '$lib/utils';

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
			return formatDateTimeISO(value as string);
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

<div
	class={cn(
		className,
		bordered
			? 'flex flex-col gap-4 p-4 border rounded-lg shadow-md bg-white'
			: '',
	)}
>
	<p class="text-l font-bold text-gray-500">{label}</p>
	<div
		class={cn(
			bordered
				? 'bg-gray-100 p-4 rounded flex justify-center items-center flex-1'
				: 'pt-2',
		)}
	>
		<span class={cn('text-xl font-semibold', colorClass())}>{data()}</span>
	</div>
</div>
