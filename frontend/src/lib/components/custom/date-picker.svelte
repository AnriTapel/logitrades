<script lang="ts">
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Root, Trigger, Content } from '$lib/components/ui/popover';
	import TimePicker from '$lib/components/custom/time-picker.svelte';

	import {
		DateFormatter,
		parseAbsoluteToLocal,
		type ZonedDateTime,
	} from '@internationalized/date';
	import { onMount } from 'svelte';

	let zonedDateTime = $state<ZonedDateTime>();

	let {
		value = $bindable<string | undefined>(),
		label = 'Date',
		placeholder = 'Pick a date',
		withTime,
		name = '',
	}: {
		value?: string;
		label?: string;
		placeholder?: string;
		withTime?: boolean;
		name?: string;
	} = $props();

	onMount(() => {
		if (value) {
			// use incoming value
			zonedDateTime = parseAbsoluteToLocal(value);
		} else {
			// just initialize zonedDateTime, but don't overwrite bound `value`
			zonedDateTime = parseAbsoluteToLocal(new Date().toISOString());
		}
	});

	// keep sync from zonedDateTime → value
	$effect(() => {
		if (zonedDateTime) {
			value = zonedDateTime.toAbsoluteString();
		}
	});

	const df = new DateFormatter('en-US', {
		dateStyle: 'medium',
		timeStyle: withTime ? 'short' : undefined,
	});
</script>

<div class="flex flex-col gap-2">
	<label class="text-sm font-bold text-gray-700" for="date-picker"
		>{label}</label
	>

	<input type="hidden" {name} {value} />

	<Root>
		<Trigger asChild let:builder>
			<Button
				variant="outline"
				builders={[builder]}
				class={cn(
					'w-auto justify-start text-left font-normal',
					!zonedDateTime && 'text-muted-foreground'
				)}
			>
				<CalendarIcon class="mr-2 h-4 w-4" />
				{zonedDateTime ? df.format(zonedDateTime.toDate()) : placeholder}
			</Button>
		</Trigger>
		<Content class="w-auto p-0">
			<Calendar bind:value={zonedDateTime} initialFocus />

			{#if withTime}
				<div class="p-4">
					<TimePicker bind:value={zonedDateTime} />
				</div>
			{/if}
		</Content>
	</Root>
</div>
