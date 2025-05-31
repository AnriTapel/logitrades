<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { ZonedDateTime } from '@internationalized/date';

	let {
		value = $bindable<ZonedDateTime>(),
		onChange,
	}: {
		value?: ZonedDateTime;
		onChange?: (value: ZonedDateTime) => void;
	} = $props();
</script>

<div class="flex gap-2 items-center">
	<Input
		type="number"
		name="hours"
		value={value.hour}
		on:input={(e) => {
			const hours = parseInt((e.target as HTMLInputElement).value, 10);
			if (!isNaN(hours) && value) {
				value = value.set({ hour: hours });
				onChange?.(value);
			}
		}}
		min="0"
		max="23"
		class="w-16"
		placeholder="hh"
		aria-label="Hours"
	/>
	<span>:</span>
	<Input
		type="number"
		name="minutes"
		min="0"
		max="59"
		value={value.minute}
		on:input={(e) => {
			const minutes = parseInt((e.target as HTMLInputElement).value, 10);
			if (!isNaN(minutes) && value) {
				value = value.set({ minute: minutes });
				onChange?.(value);
			}
		}}
		class="w-16"
		placeholder="mm"
		aria-label="Minutes"
	/>
	<span>:</span>
	<Input
		type="number"
		name="seconds"
		min="0"
		max="59"
		value={value.second}
		on:input={(e) => {
			const seconds = parseInt((e.target as HTMLInputElement).value, 10);
			if (!isNaN(seconds) && value) {
				value = value.set({ second: seconds });
				onChange?.(value);
			}
		}}
		class="w-16"
		placeholder="ss"
		aria-label="Seconds"
	/>
</div>
