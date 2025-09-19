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
		if (type === 'money') {
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(Number(value));
		} else if (type === 'percentage') {
			return `${Number(value).toFixed(2)}%`;
		} else if (type === 'integer') {
			return Math.round(Number(value)).toString();
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

<div class="p-4 border rounded-lg shadow-sm min-w-[200px] w-min">
	<p class="text-l font-bold mb-4">{label}</p>
	<div
		class="bg-gray-100 p-4 rounded flex justify-center items-center width-fit h-[80px]"
	>
		<span class="text-2xl font-semibold">{data()}</span>
	</div>
</div>
