<script lang="ts">
	import { tick } from 'svelte';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { CURRENCIES } from '$lib/constants/currencies';
	import { clientLazyLoad } from '$lib/clientLazyLoad';

	let {
		value = $bindable(''),
		disabled = false,
		onValueChange,
	}: {
		value?: string;
		disabled?: boolean;
		onValueChange?: (code: string) => void;
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const selectedOption = $derived(
		CURRENCIES.find((o) => o.code === value) ?? null,
	);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	function handleSelect(next: string) {
		if (disabled || next === value) {
			closeAndFocusTrigger();
			return;
		}

		value = next;
		closeAndFocusTrigger();
		onValueChange?.(next);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="grow justify-between"
				role="combobox"
				aria-expanded={open}
				{disabled}
			>
				{#if selectedOption}
					{#key selectedOption.code}
						<img
							src={selectedOption.flagUrl}
							alt={selectedOption.code}
							width="20"
							height="15"
							class="shrink-0"
						/>
					{/key}
					<span>{selectedOption.code}</span>
				{:else}
					<span>{value}</span>
				{/if}
				<ChevronsUpDown class="ms-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[130px] p-0" align="start">
		<Command.Root>
			<Command.List class="max-h-[200px] overflow-y-auto">
				<Command.Group>
					{#each CURRENCIES as option (option.code)}
						<Command.Item
							value={option.code}
							onSelect={() => handleSelect(option.code)}
						>
							<Check
								class={cn(
									'me-2 size-4 shrink-0',
									value !== option.code && 'text-transparent',
								)}
							/>
							<img use:clientLazyLoad={option.flagUrl} alt={option.code} />
							<span>{option.code}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
