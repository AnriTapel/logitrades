<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import {
		CalendarDate,
		CalendarDateTime,
		getLocalTimeZone,
		type DateValue,
	} from '@internationalized/date';
	import {
		formatTradeDateLocal,
		toUtcIso,
		type UtcIsoDateTime,
	} from '$lib/dates';

	const DEFAULT_TIME = '00:00:00';

	let {
		value = $bindable<string | undefined>(),
		label,
		name = '',
		placeholder = 'Select date',
		withTime = false,
	}: {
		value?: string | null;
		label?: string;
		placeholder?: string;
		withTime?: boolean;
		name?: string;
	} = $props();

	let open = $state(false);

	const calendarDate = $derived.by(() => {
		if (!value) return undefined;
		const d = new Date(value);
		return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
	});

	const timeString = $derived.by(() => {
		if (!value) return DEFAULT_TIME;
		const d = new Date(value);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
	});

	const partsToUtcIso = (date: CalendarDate, time: string): UtcIsoDateTime => {
		const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number);
		const dateTime = new CalendarDateTime(
			date.year,
			date.month,
			date.day,
			hours,
			minutes,
			seconds,
		);
		return toUtcIso(dateTime.toDate(getLocalTimeZone()).toISOString());
	};

	const onCalendarChange = (date: DateValue | undefined): void => {
		if (date) {
			value = partsToUtcIso(
				date as CalendarDate,
				withTime ? timeString : DEFAULT_TIME,
			);
		} else {
			value = undefined;
		}
		open = false;
	};

	const onTimeChange = (e: Event): void => {
		const input = e.currentTarget as HTMLInputElement;
		if (!calendarDate) return;
		value = partsToUtcIso(calendarDate, input.value || DEFAULT_TIME);
	};
</script>

<input type="hidden" {name} value={value ?? ''} />
{#if label}
	<Label for="{name}-date">{label}</Label>
{/if}
<div class="flex gap-2 w-auto">
	<div class="flex flex-col gap-4">
		<Popover.Root bind:open>
			<Popover.Trigger id="{name}-date">
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="w-40 justify-between font-normal"
					>
						{value ? formatTradeDateLocal(value) : placeholder}
						<ChevronDownIcon />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto overflow-hidden p-0" align="start">
				<Calendar
					type="single"
					value={calendarDate}
					onValueChange={onCalendarChange}
				/>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if withTime}
		<div class="flex flex-col gap-3">
			<Input
				type="time"
				id="{name}-time"
				step="1"
				disabled={!calendarDate}
				value={timeString}
				oninput={onTimeChange}
				class="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
			/>
		</div>
	{/if}
</div>
