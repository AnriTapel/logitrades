<script lang="ts">
	import { tick } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { formSchema, type TradeFormData } from '$lib/schemas/tradeSchemas';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { DatePicker } from '$lib';
	import ToggleGroup from '$lib/components/custom/toggle-group.svelte';
	import { showServerErrors } from '$lib/stores/error';
	import type { HttpError } from '$lib/server/http-client/types';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import { cn } from '$lib/utils';
	import { Textarea } from '$lib/components/ui/textarea';

	let {
		data,
		existingSymbols,
		isEdit = false,
		onCancel,
	}: {
		data: SuperValidated<TradeFormData>;
		isEdit?: boolean;
		existingSymbols: string[];
		onCancel: () => void;
	} = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		id: 'trade-form',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				onCancel();
			} else if (result.type == 'failure') {
				showServerErrors(result.data?.error as HttpError);
			}
		},
	});

	const { form: formData, enhance } = form;

	let symbolOpen = $state(false);
	let symbolSearch = $state($formData.symbol ?? '');
	let symbolTriggerRef = $state<HTMLButtonElement | null>(null);

	const modalTitle = $derived(
		isEdit ? `Edit Trade Note #${$formData.id}` : 'Create Trade Note',
	);

	const fieldLabelClass =
		'text-xs font-semibold uppercase tracking-[0.6px] text-[#4c6076]';
	const cardFieldLabelClass =
		'text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]';
	const filledInputClass = 'h-11 rounded border-transparent bg-[#f3f3f7]';
	const cardInputClass =
		'h-10 rounded border border-[rgba(194,199,207,0.2)] bg-white';
	const datePickerFieldClass =
		'[&_label]:text-[10px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-[1px] [&_label]:text-[#94a3b8] [&_button]:h-10 [&_button]:rounded [&_button]:border [&_button]:border-[rgba(194,199,207,0.2)] [&_button]:bg-white [&_input]:h-10 [&_input]:rounded [&_input]:border [&_input]:border-[rgba(194,199,207,0.2)] [&_input]:bg-white';

	const filteredSymbolOptions = $derived.by(() => {
		const query = symbolSearch.trim().toUpperCase();

		if (!query) {
			return existingSymbols;
		}

		return existingSymbols.filter((symbol) =>
			symbol.includes(query.toUpperCase()),
		);
	});
	const hasExactSymbolOption = $derived(existingSymbols.includes(symbolSearch));

	const setSymbolValue = (value: string): void => {
		const normalizedValue = value.trim().toUpperCase();
		symbolSearch = normalizedValue;
		$formData.symbol = normalizedValue;
	};

	const closeSymbolCombobox = (): void => {
		symbolOpen = false;
		tick().then(() => {
			symbolTriggerRef?.focus();
		});
	};

	const selectSymbol = (value: string): void => {
		setSymbolValue(value);
		closeSymbolCombobox();
	};

	const handleSubmit = async (): Promise<void> => {
		const validatedForm = await form.validateForm();
		if (validatedForm.valid) {
			form.submit();
		} else {
			form.errors.set(validatedForm.errors);
		}
	};

	const handleCancel = (): void => {
		form.reset();
		onCancel();
	};

	const handleOpenChange = (isOpen: boolean): void => {
		if (!isOpen) {
			handleCancel();
		}
	};

	const setDecimalField = (
		field: 'quantity' | 'openPrice',
		raw: string,
	): void => {
		$formData[field] = raw === '' ? undefined : Number(raw);
	};
</script>

<Dialog.Root open onOpenChange={handleOpenChange}>
	<Dialog.Content
		class="h-auto max-h-[90vh] w-auto max-w-full rounded-lg min-h-0 flex flex-col sm:w-[680px]"
	>
		<Dialog.Header class="flex-shrink-0">
			<Dialog.Title class="text-2xl font-bold text-[#003d6d]"
				>{modalTitle}</Dialog.Title
			>
		</Dialog.Header>

		<form
			method="POST"
			use:enhance
			action={isEdit ? '?/update' : '?/create'}
			class="flex flex-col gap-10 py-4 px-2 overflow-y-auto flex-grow"
		>
			{#if isEdit && $formData.id}
				<input type="hidden" name="id" value={$formData.id} />
			{/if}

			{#if isEdit && $formData.id}
				<input type="hidden" name="createdAt" value={$formData.createdAt} />
			{/if}

			<section class="flex flex-col gap-6">
				<div class="flex items-center gap-3">
					<div class="h-4 w-1 rounded-full bg-[#003d6d]"></div>
					<span
						class="text-sm font-bold uppercase tracking-[1.4px] text-[#1a1c1f]"
					>
						Trade Setup
					</span>
				</div>

				<div class="grid grid-cols-12 gap-6">
					<Field
						{form}
						name="tradeType"
						class="col-span-12 flex flex-col gap-2 sm:col-span-4"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Side *</FormLabel>
								<ToggleGroup
									{...props}
									name="tradeType"
									bind:value={$formData.tradeType}
									class="h-11 w-full gap-0 rounded bg-[#f3f3f7] p-1"
									itemClass="h-full flex-1 rounded text-xs font-bold uppercase data-[state=on]:bg-white data-[state=on]:text-[#003d6d] data-[state=on]:shadow-sm data-[state=off]:text-[#64748b]"
									options={[
										{ label: 'LONG', value: 'buy', icon: TrendingUp },
										{ label: 'SHORT', value: 'sell', icon: TrendingDown },
									]}
								/>
							{/snippet}
						</Control>
						<FieldErrors>
							{#snippet children({ errors })}
								<span class="text-destructive text-sm font-medium">
									{errors[0]}
								</span>
							{/snippet}
						</FieldErrors>
					</Field>

					<Field
						{form}
						name="symbol"
						class="col-span-6 flex flex-col gap-2 sm:col-span-4"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Symbol *</FormLabel>
								<input
									type="hidden"
									name={props.name}
									value={$formData.symbol}
								/>
								<Popover.Root bind:open={symbolOpen}>
									<Popover.Trigger bind:ref={symbolTriggerRef}>
										{#snippet child({ props: triggerProps })}
											<Button
												{...triggerProps}
												id={props.id}
												variant="outline"
												class={cn(
													filledInputClass,
													'w-full justify-between px-3 text-left font-normal uppercase hover:bg-[#f3f3f7]',
													!$formData.symbol && 'text-muted-foreground',
												)}
												role="combobox"
												aria-expanded={symbolOpen}
												aria-invalid={props['aria-invalid']}
												aria-describedby={props['aria-describedby']}
											>
												<span class="truncate">
													{$formData.symbol || 'e.g. AAPL'}
												</span>
												<ChevronsUpDown
													class="ml-2 size-4 shrink-0 opacity-50"
												/>
											</Button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content class="w-[240px] p-0" align="start">
										<Command.Root>
											<Command.Input
												class="h-9"
												placeholder="Search or enter symbol..."
												bind:value={symbolSearch}
												oninput={() => setSymbolValue(symbolSearch)}
												onkeydown={(event) => {
													if (event.key === 'Enter' && symbolSearch) {
														event.preventDefault();
														selectSymbol(symbolSearch.trim().toUpperCase());
													}
												}}
											/>
											<Command.List class="max-h-[220px] overflow-y-auto">
												{#if filteredSymbolOptions.length === 0 && !symbolSearch}
													<Command.Empty>No symbols found.</Command.Empty>
												{/if}
												<Command.Group>
													{#if symbolSearch && !hasExactSymbolOption}
														<Command.Item
															value={symbolSearch}
															onSelect={() => selectSymbol(symbolSearch)}
														>
															Use "{symbolSearch}"
														</Command.Item>
													{/if}
													{#each filteredSymbolOptions as symbol (symbol)}
														<Command.Item
															value={symbol}
															onSelect={() => selectSymbol(symbol)}
														>
															<span>{symbol}</span>
															<Check
																class={cn(
																	'ml-auto size-4 shrink-0',
																	$formData.symbol === symbol
																		? 'opacity-100'
																		: 'opacity-0',
																)}
															/>
														</Command.Item>
													{/each}
												</Command.Group>
											</Command.List>
										</Command.Root>
									</Popover.Content>
								</Popover.Root>
							{/snippet}
						</Control>
						<FieldErrors>
							{#snippet children({ errors })}
								<span class="text-destructive text-sm font-medium">
									{errors[0]}
								</span>
							{/snippet}
						</FieldErrors>
					</Field>

					<Field
						{form}
						name="quantity"
						class="col-span-6 flex flex-col gap-2 sm:col-span-4"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Quantity *</FormLabel>
								<Input
									{...props}
									type="number"
									class={filledInputClass}
									required
									step="0.000000001"
									min="0.000000001"
									placeholder="0"
									value={$formData.quantity ?? ''}
									oninput={(e) =>
										setDecimalField('quantity', e.currentTarget.value)}
								/>
							{/snippet}
						</Control>
						<FieldErrors>
							{#snippet children({ errors })}
								<div class="text-destructive text-sm font-medium">
									{errors[0]}
								</div>
							{/snippet}
						</FieldErrors>
					</Field>

					<Field {form} name="comment" class="col-span-12 flex flex-col gap-2">
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Comment</FormLabel>
								<Textarea
									{...props}
									class={filledInputClass + " max-h-30"}
									rows={3}
									placeholder="Enter a comment for this trade"
									bind:value={$formData.comment}
								/>
							{/snippet}
						</Control>
						<FieldErrors>
							{#snippet children({ errors })}
								<div class="text-destructive text-sm font-medium">
									{errors[0]}
								</div>
							{/snippet}
						</FieldErrors>
					</Field>
				</div>
			</section>

			<section class="flex flex-col gap-6">
				<div class="flex items-center gap-3">
					<div class="h-4 w-1 rounded-full bg-[#003d6d]"></div>
					<span
						class="text-sm font-bold uppercase tracking-[1.4px] text-[#1a1c1f]"
					>
						Entry & Exit
					</span>
				</div>

				<div
					class="rounded-lg border border-[rgba(194,199,207,0.1)] bg-[rgba(243,243,247,0.3)] p-[25px]"
				>
					<div class="grid grid-cols-12 gap-6">
						<div class="col-span-12 flex flex-col gap-4 sm:col-span-6">
							<Field {form} name="openPrice" class="flex flex-col gap-2">
								<Control>
									{#snippet children({ props })}
										<FormLabel class={cardFieldLabelClass}
											>Open Price *</FormLabel
										>
										<Input
											{...props}
											type="number"
											class={cardInputClass}
											required
											step="0.000000001"
											min="0.000000001"
											placeholder="0.00"
											value={$formData.openPrice ?? ''}
											oninput={(e) =>
												setDecimalField('openPrice', e.currentTarget.value)}
										/>
									{/snippet}
								</Control>
								<FieldErrors>
									{#snippet children({ errors })}
										<div class="text-destructive text-sm font-medium">
											{errors[0]}
										</div>
									{/snippet}
								</FieldErrors>
							</Field>

							<Field
								{form}
								name="openedAt"
								class={cn('flex flex-col gap-2', datePickerFieldClass)}
							>
								<Control>
									{#snippet children({ props })}
										<DatePicker
											{...props}
											name="openedAt"
											bind:value={$formData.openedAt}
											withTime
											label="Opened At *"
										/>
									{/snippet}
								</Control>
								<FieldErrors>
									{#snippet children({ errors })}
										<span class="text-destructive text-sm font-medium">
											{errors[0]}
										</span>
									{/snippet}
								</FieldErrors>
							</Field>
						</div>

						<div
							class="col-span-12 flex flex-col gap-4 border-l border-[rgba(194,199,207,0.1)] sm:col-span-6"
						>
							<Field {form} name="closePrice" class="flex flex-col gap-2">
								<Control>
									{#snippet children({ props })}
										<FormLabel class={cardFieldLabelClass}
											>Close Price</FormLabel
										>
										<Input
											{...props}
											type="number"
											class={cardInputClass}
											step="0.000000001"
											min="0.000000001"
											placeholder="0.00"
											bind:value={$formData.closePrice}
										/>
									{/snippet}
								</Control>
								<FieldErrors>
									{#snippet children({ errors })}
										<span class="text-destructive text-sm font-medium">
											{errors[0]}
										</span>
									{/snippet}
								</FieldErrors>
							</Field>

							<Field
								{form}
								name="closedAt"
								class={cn('flex flex-col gap-2', datePickerFieldClass)}
							>
								<Control>
									{#snippet children({ props })}
										<DatePicker
											{...props}
											name="closedAt"
											bind:value={$formData.closedAt}
											withTime
											label="Closed At"
										/>
									{/snippet}
								</Control>
								<FieldErrors>
									{#snippet children({ errors })}
										<span class="text-destructive text-sm font-medium">
											{errors[0]}
										</span>
									{/snippet}
								</FieldErrors>
							</Field>
						</div>
					</div>
				</div>
			</section>

			<section class="flex flex-col gap-6">
				<div class="flex items-center gap-3">
					<div class="h-4 w-1 rounded-full bg-[#003d6d]"></div>
					<span
						class="text-sm font-bold uppercase tracking-[1.4px] text-[#1a1c1f]"
					>
						Risk Management
					</span>
				</div>

				<div
					class="rounded-lg border border-[rgba(194,199,207,0.1)] bg-[rgba(243,243,247,0.3)] p-[25px] flex flex-col gap-6"
				>
					<div class="flex flex-col gap-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Field {form} name="useLeverage">
									<Control>
										{#snippet children({ props })}
											<input
												name="useLeverage"
												type="checkbox"
												value={$formData.useLeverage}
												hidden
											/>
											<Checkbox
												{...props}
												bind:checked={$formData.useLeverage}
											/>
										{/snippet}
									</Control>
								</Field>
								<span class={fieldLabelClass}>Leverage</span>
							</div>
							<span
								class={cn(
									'rounded-[2px] bg-[#d2e4ff] px-2 py-0.5 text-[10px] font-bold text-[#001c37]',
									{ 'opacity-50': !$formData.useLeverage },
								)}
							>
								{$formData.leverage}x
							</span>
						</div>

						<Field {form} name="leverage" class="flex flex-col gap-2 px-1">
							<Control>
								{#snippet children({ props })}
									<input name="leverage" value={$formData.leverage} hidden />
									<Slider
										type="single"
										{...props}
										disabled={!$formData.useLeverage}
										bind:value={$formData.leverage}
										min={1}
										max={50}
										step={1}
									/>
									<div
										class="flex justify-between text-[10px] font-medium text-[#94a3b8]"
									>
										<span>1x</span>
										<span>25x</span>
										<span>50x</span>
									</div>
								{/snippet}
							</Control>
						</Field>
					</div>

					<div class="grid grid-cols-12 gap-6">
						<Field
							{form}
							name="takeProfit"
							class="col-span-12 flex flex-col gap-2 sm:col-span-6"
						>
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Take Profit</FormLabel>
									<Input
										{...props}
										type="number"
										class={filledInputClass}
										step="0.000000001"
										min="0.000000001"
										placeholder="Enter target price"
										bind:value={$formData.takeProfit}
									/>
								{/snippet}
							</Control>
							<FieldErrors>
								{#snippet children({ errors })}
									<span class="text-destructive text-sm font-medium">
										{errors[0]}
									</span>
								{/snippet}
							</FieldErrors>
						</Field>

						<Field
							{form}
							name="stopLoss"
							class="col-span-12 flex flex-col gap-2 sm:col-span-6"
						>
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Stop Loss</FormLabel>
									<Input
										{...props}
										type="number"
										class={filledInputClass}
										step="0.000000001"
										min="0.000000001"
										placeholder="Enter exit safety"
										bind:value={$formData.stopLoss}
									/>
								{/snippet}
							</Control>
							<FieldErrors>
								{#snippet children({ errors })}
									<span class="text-destructive text-sm font-medium">
										{errors[0]}
									</span>
								{/snippet}
							</FieldErrors>
						</Field>
					</div>
				</div>
			</section>
		</form>

		<Dialog.Footer class="flex-shrink-0">
			<Dialog.Close>
				<Button
					variant="ghost"
					type="reset"
					class="px-6 font-bold text-[#4c6076] hover:bg-transparent"
					onclick={handleCancel}
				>
					Cancel
				</Button>
			</Dialog.Close>

			<Button
				type="submit"
				class="bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
				onclick={handleSubmit}
			>
				Submit Position
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
