<script lang="ts">
	const {
		label,
		value,
		type = 'string',
	}: {
		label: string;
		value: string | number;
		type?: 'money' | 'percentage' | 'integer' | 'string' | 'date';
	} = $props();

	const data = $derived(() => {
		const numValue = Number(value);

		if (type === 'money') {
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(numValue);
		} else if (type === 'percentage') {
			return `${numValue.toFixed(2)}%`;
		} else if (type === 'integer') {
			return new Intl.NumberFormat('en-US', {
				notation: 'standard',
			}).format(Math.round(numValue));
		} else if (type === 'date') {
			const date = new Date(value);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		} else {
			return value.toString();
		}
	});
</script>

<div class="flex flex-col gap-4 p-4 border rounded-lg shadow-sm">
	<p class="text-l font-bold">{label}</p>
	<div class="bg-gray-100 p-4 rounded flex justify-center items-center flex-1">
		<span class="text-2xl font-semibold">{data()}</span>
	</div>
</div>
