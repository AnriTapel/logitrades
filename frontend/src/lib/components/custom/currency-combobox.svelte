<script lang="ts">
	import { tick } from 'svelte';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { localeStore } from '$lib/stores/locale';
	import { CURRENCIES } from '$lib/constants/currencies';
	import { clientLazyLoad } from '$lib/clientLazyLoad';

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const currency = $derived($localeStore.currency);
	$effect(() => console.log(currency));
	const selectedOption = $derived(
		CURRENCIES.find((o) => o.code === currency) ?? null,
	);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	function handleSelect(value: string) {
		localeStore.update((s) => ({ ...s, currency: value }));
		closeAndFocusTrigger();
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="w-[140px] justify-between"
				role="combobox"
				aria-expanded={open}
			>
				{#if selectedOption}
					<img
						use:clientLazyLoad={selectedOption.flagUrl}
						alt={selectedOption.code}
					/>
					<span>{selectedOption.code}</span>
				{:else}
					<span>{currency}</span>
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
									currency !== option.code && 'text-transparent',
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
