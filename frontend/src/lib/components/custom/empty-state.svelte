<script lang="ts">
	import ChartColumn from '@lucide/svelte/icons/chart-column';

	const {
		message = 'Nothing to show yet',
		className = '',
	}: {
		message?: string;
		className?: string;
	} = $props();
</script>

<div
	class="w-full grow flex flex-col justify-center items-center gap-2 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-6 min-h-[150px] {className}"
>
	<ChartColumn class="text-gray-500" />

	<span class="text-sm text-gray-500 text-center">{message}</span>
</div>
