<script lang="ts">
	import { formatISOToDateTimeStr } from '$lib/formatters';
	import ClockArrowUp from 'lucide-svelte/icons/clock-arrow-up';
	import ClockArrowDown from 'lucide-svelte/icons/clock-arrow-down';

	const {
		openedAt,
		closedAt,
	}: {
		openedAt: string;
		closedAt?: string;
	} = $props();
</script>

<div class="flex flex-col gap-1 w-[190px]">
	<div class="flex gap-1 items-center" title="Opened At">
		<ClockArrowUp size="16" />
		<span class="font-medium cursor-default"
			>{openedAt ? formatISOToDateTimeStr(openedAt) : '-'}</span
		>
	</div>
	<div class="flex gap-1 items-center" title="Closed At">
		<ClockArrowDown size="16" />
		<span class="font-medium cursor-default"
			>{closedAt ? formatISOToDateTimeStr(closedAt) : '-'}</span
		>
	</div>
</div>
