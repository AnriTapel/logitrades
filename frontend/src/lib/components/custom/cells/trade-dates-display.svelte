<script lang="ts">
	import { formatTradeDateTimeLocal, type UtcIsoDateTime } from '$lib/dates';
	import ClockArrowUp from 'lucide-svelte/icons/clock-arrow-up';
	import ClockArrowDown from 'lucide-svelte/icons/clock-arrow-down';

	const {
		openedAt,
		closedAt,
	}: {
		openedAt: UtcIsoDateTime;
		closedAt?: UtcIsoDateTime;
	} = $props();
</script>

<div class="flex flex-col gap-1 w-[190px]">
	<div class="flex gap-1 items-center" title="Opened At">
		<ClockArrowUp size="16" />
		<span class="font-medium cursor-default"
			>{formatTradeDateTimeLocal(openedAt)}</span
		>
	</div>
	<div class="flex gap-1 items-center" title="Closed At">
		<ClockArrowDown size="16" />
		<span class="font-medium cursor-default"
			>{closedAt ? formatTradeDateTimeLocal(closedAt) : '-'}</span
		>
	</div>
</div>
