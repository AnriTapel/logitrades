<script lang="ts">
	import {
		formatDateTimeISO,
		formatIntToCurrency,
		formatNumber,
		formatNumberPercentage,
	} from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { cn } from '$lib/utils';

	const {
		label,
		value,
		type = 'string',
		bordered = true,
		className = '',
	}: {
		label: string;
		value: string | number;
		type?: 'money' | 'percentage' | 'integer' | 'string' | 'date';
		bordered?: boolean;
		className?: string;
	} = $props();

	const data = $derived(() => {
		const numValue = Number(value);

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
</script>

<div
	class={cn(
		className,
		bordered ? 'flex flex-col gap-4 p-4 border rounded-lg shadow-sm' : '',
	)}
>
	<p class="text-l font-bold text-gray-500">{label}</p>
	<div
		class={cn(
			className,
			bordered
				? 'bg-gray-100 p-4 rounded flex justify-center items-center flex-1'
				: 'pt-2',
		)}
	>
		<span class="text-xl font-semibold">{data()}</span>
	</div>
</div>
