<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import {
		CalendarDateTime,
		DateFormatter,
		getLocalTimeZone,
		parseDateTime,
	} from '@internationalized/date';
	import { onMount } from 'svelte';
	import { formatDateTimeISO } from '$lib/formatters';

	let dateTime = $state<CalendarDateTime | undefined>();

	let {
		value = $bindable<string | undefined>(),
		label = 'Date',
		name = '',
	}: {
		value?: string | null;
		label?: string;
		placeholder?: string;
		withTime?: boolean;
		name?: string;
	} = $props();

	onMount(() => {
		if (value) {
			dateTime = parseDateTime(value.replace('Z', ''));
		}
	});

	// keep sync from zonedDateTime → value
	$effect(() => {
		if (dateTime) {
			value = formatDateTimeISO(
				dateTime.toDate(getLocalTimeZone()).toISOString()
			);
		}
	});

	const df = new DateFormatter('en-US', {
		dateStyle: 'short',
	});
</script>

<input type="hidden" {name} {value} />
<Label for="{name}-date">{label}</Label>
<div class="flex gap-4 w-auto">
	<div class="flex flex-col gap-4">
		<Popover.Root>
			<Popover.Trigger id="{name}-date">
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="w-40 justify-between font-normal"
					>
						{dateTime
							? df.format(dateTime.toDate(getLocalTimeZone()))
							: 'Select date'}
						<ChevronDownIcon />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto overflow-hidden p-0" align="start">
				<Calendar type="single" bind:value={dateTime} />
			</Popover.Content>
		</Popover.Root>
	</div>

	<!-- TODO: resolve time input -->
	<!-- <div class="flex flex-col gap-3">
		<Input
			type="time"
			id="{name}-time"
			step="1"
			value={timeValue}
			oninput={(e) => {
				if (dateTime) {
					const [hours, minutes, seconds] = (e.target as HTMLInputElement).value
						.split(':')
						.map(Number);
					dateTime.set({
						hour: hours,
						minute: minutes,
						second: seconds,
					});
				}
			}}
			class="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
		/>
	</div> -->
</div>
