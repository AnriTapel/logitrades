<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import {
		formSchema,
		type TradeFormData,
		tagSchema,
		tagsSchema,
		MAX_TRADE_TAGS,
	} from '$lib/schemas/tradeSchemas';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { standardClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { DatePicker } from '$lib';
	import ToggleGroup from '$lib/components/custom/toggle-group.svelte';
	import TradeFormField from '$lib/components/custom/trade-form-field.svelte';
	import LeverageSlider from '$lib/components/custom/leverage-slider.svelte';
	import PositionSizeCalculator from '$lib/components/custom/position-size-calculator.svelte';
	import { showServerErrors } from '$lib/stores/error';
	import type { HttpError } from '$lib/server/http-client/types';
	import {
		Check,
		ChevronsUpDown,
		TrendingDown,
		TrendingUp,
		X,
	} from 'lucide-svelte/icons';
	import { cn } from '$lib/utils';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';

	import type { Portfolio, PortfolioSummary } from '$lib/types';
	import { effectiveCurrency } from '$lib/portfolio/effectiveCurrency';
	import {
		Content as SelectContent,
		Root as SelectRoot,
		Trigger as SelectTrigger,
		Item as SelectItem,
	} from '$lib/components/ui/select';

	let {
		data,
		existingSymbols,
		existingTags,
		isEdit = false,
		mode = 'write',
		portfolios = [],
		activePortfolioId = undefined,
		plan = 'free',
		portfolioSummary = null,
		userCurrency = undefined,
	}: {
		data: SuperValidated<TradeFormData>;
		isEdit?: boolean;
		mode?: 'write' | 'read';
		existingSymbols: string[];
		existingTags: string[];
		portfolios?: Portfolio[];
		activePortfolioId?: number;
		plan?: string;
		portfolioSummary?: PortfolioSummary | null;
		userCurrency?: string;
	} = $props();

	const form = $derived.by(() =>
		superForm(data, {
			validators: standardClient(formSchema),
			id: 'trade-form',
			onResult: ({ result }) => {
				if (result.type === 'success' || result.type === 'redirect') {
					goto('/journal');
				} else if (result.type == 'failure') {
					showServerErrors(result.data?.error as HttpError);
				}
			},
		}),
	);

	const { form: formData, enhance } = $derived(form);

	// Non-archived portfolios that can receive new trades
	const selectablePortfolios = $derived(
		portfolios.filter((p) => p.status !== 'archived'),
	);
	// Check if the currently active portfolio is archived
	const activePortfolio = $derived(
		portfolios.find(
			(p) => p.id === ($formData.portfolioId ?? activePortfolioId),
		) ?? null,
	);
	const isArchivedPortfolio = $derived(activePortfolio?.status === 'archived');

	const calculatorCurrency = $derived(
		effectiveCurrency({
			userCurrency,
			activePortfolio,
		}),
	);

	const calculatorInitialBalance = $derived(portfolioSummary?.equity ?? null);

	let symbolOpen = $state(false);
	let symbolSearch = $state($formData.symbol ?? '');
	let symbolTriggerRef = $state<HTMLButtonElement | null>(null);

	const isWriteMode = $derived(mode === 'write');

	const pageTitle = $derived(
		isEdit ? `Edit Trade Note #${$formData.id}` : 'Create Trade Note',
	);

	const tradeTypeDisplay = $derived(
		$formData.tradeType === 'buy' ? 'LONG' : 'SHORT',
	);

	const leverageDisplay = $derived(
		!$formData.useLeverage || !$formData.leverage
			? 'Off'
			: `${$formData.leverage}x`,
	);

	const fieldLabelClass =
		'text-xs font-semibold uppercase tracking-[0.6px] text-[#4c6076]';
	const cardFieldLabelClass =
		'text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]';
	const filledInputClass = 'h-11 rounded border-transparent bg-[#f3f3f7]';
	const cardInputClass =
		'h-10 rounded border border-[rgba(194,199,207,0.2)] bg-white';
	const datePickerFieldClass =
		'flex flex-col gap-2 shrink-0 [&_button]:h-11 [&_button]:rounded [&_button]:border-transparent [&_button]:bg-[#f3f3f7] [&_input]:h-11 [&_input]:rounded [&_input]:border-transparent [&_input]:bg-[#f3f3f7]';

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

	let tagOpen = $state(false);
	let tagSearch = $state('');
	let tagTriggerRef = $state<HTMLButtonElement | null>(null);

	const tradeTags = $derived($formData.tags ?? []);

	const filteredTagOptions = $derived.by(() => {
		const query = tagSearch.trim().toLowerCase();
		const available = existingTags.filter(
			(tag) => !tradeTags.some((t) => t.toLowerCase() === tag.toLowerCase()),
		);

		if (!query) {
			return available;
		}

		return available.filter((tag) => tag.toLowerCase().includes(query));
	});

	const hasExactTagOption = $derived(
		existingTags.some(
			(tag) => tag.toLowerCase() === tagSearch.trim().toLowerCase(),
		),
	);

	const canAddMoreTags = $derived(tradeTags.length < MAX_TRADE_TAGS);

	let tagInputError = $state<string | null>(null);
	let calculatorOpen = $state(false);

	const hasTag = (value: string): boolean =>
		tradeTags.some((tag) => tag.toLowerCase() === value.toLowerCase());

	const addTag = (value: string): boolean => {
		tagInputError = null;
		const normalizedValue = value.trim();

		if (!normalizedValue || hasTag(normalizedValue)) {
			return false;
		}

		const parsedTag = tagSchema.safeParse(normalizedValue);

		if (!parsedTag.success) {
			tagInputError = parsedTag.error.issues[0]?.message ?? 'Invalid tag';
			return false;
		}

		const parsedTags = tagsSchema.safeParse([...tradeTags, parsedTag.data]);
		if (!parsedTags.success) {
			tagInputError = parsedTags.error.issues[0]?.message ?? 'Invalid tags';
			return false;
		}

		$formData.tags = parsedTags.data;
		tagSearch = '';
		return true;
	};

	const removeTag = (index: number): void => {
		const next = tradeTags.filter((_, i) => i !== index);
		$formData.tags = next.length > 0 ? next : undefined;
		tagInputError = null;
	};

	const closeTagCombobox = (): void => {
		tagOpen = false;
		tagInputError = null;
		tick().then(() => {
			tagTriggerRef?.focus();
		});
	};

	const selectTag = (value: string): void => {
		if (addTag(value)) {
			closeTagCombobox();
		}
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
		goto('/journal');
	};

	const setDecimalField = (
		field: 'quantity' | 'openPrice',
		raw: string,
	): void => {
		$formData[field] = raw === '' ? undefined : Number(raw);
	};
</script>

<div class={['flex flex-col', isWriteMode && '-m-4 sm:-m-8']}>
	<div class={['flex-1 overflow-y-auto', isWriteMode && 'px-4 py-6 sm:px-8 sm:py-8']}>
		{#if isWriteMode}
			<header class="mb-8 md:mb-10 flex items-center justify-between gap-4">
				<h1 class="text-2xl font-extrabold tracking-tight text-[#1a1c1f]">
					{pageTitle}
				</h1>
				<Button
					type="button"
					variant="outline"
					class="shrink-0 font-semibold"
					onclick={() => {
						calculatorOpen = true;
					}}
				>
					Position calculator
				</Button>
			</header>
		{/if}

		<form
			method="POST"
			use:enhance
			action={isEdit ? '?/update' : '?/create'}
			class="flex flex-col gap-10 md:gap-12"
			onsubmit={(e) => {
				if (!isWriteMode) e.preventDefault();
			}}
		>
			{#if isEdit && $formData.id}
				<input type="hidden" name="id" value={$formData.id} />
			{/if}

			{#if isEdit && $formData.id}
				<input type="hidden" name="createdAt" value={$formData.createdAt} />
			{/if}

			<input
				type="hidden"
				name="portfolioId"
				value={$formData.portfolioId ?? activePortfolioId ?? ''}
			/>

			<section class="flex flex-col gap-6 md:gap-8">
				<div class="flex items-center gap-3">
					<div class="h-4 w-1 rounded-full bg-[#003d6d]"></div>
					<span
						class="text-sm font-bold uppercase tracking-[1.4px] text-[#1a1c1f]"
					>
						Trade Setup
					</span>
				</div>

				{#if plan === 'max' && selectablePortfolios.length > 1}
					<div class="flex flex-col gap-2 max-w-md">
						<Field {form} name="portfolioId">
							<Control>
								<TradeFormField
									{mode}
									format="string"
									value={activePortfolio?.name ?? ''}
								>
									<SelectRoot
										type="single"
										value={$formData.portfolioId?.toString()}
										onValueChange={(value) =>
											($formData.portfolioId = parseInt(value))}
									>
										<SelectTrigger
											class="w-full border-[#e2e8f0] bg-white px-2 py-1.5 text-sm text-[#1a1c1f] shadow-none"
											placeholder="Select a portfolio"
										>
											<span>{activePortfolio?.name ?? 'Select a portfolio'}</span>
										</SelectTrigger>
										<SelectContent>
											{#each portfolios as portfolio (portfolio.id)}
												{@const label =
													portfolio.status === 'archived'
														? `${portfolio.name} [Archived]`
														: portfolio.name}
												<SelectItem value={String(portfolio.id)} {label}>
													{label}
												</SelectItem>
											{/each}
										</SelectContent>
									</SelectRoot>
								</TradeFormField>
							</Control>

							{#if isArchivedPortfolio}
								<p
									class="text-sm text-amber-600 font-medium rounded bg-amber-50 border border-amber-200 px-3 py-2"
								>
									This portfolio is archived. No trades can be added.
								</p>
							{/if}
						</Field>
					</div>
				{/if}

				<div class="grid grid-cols-1 gap-6 md:grid-cols-6 md:gap-8">
					<Field
						{form}
						name="tradeType"
						class="flex flex-col gap-2 col-span-1 md:col-span-2"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Side *</FormLabel>
								<TradeFormField
									{mode}
									format="string"
									value={tradeTypeDisplay}
								>
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
								</TradeFormField>
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
						class="flex flex-col gap-2 col-span-1 md:col-span-2"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Symbol *</FormLabel>
								<TradeFormField
									{mode}
									format="string"
									value={$formData.symbol ?? ''}
								>
									<input
										type="hidden"
										name={props.name}
										value={$formData.symbol}
									/>
									<Popover.Root
										bind:open={symbolOpen}
									>
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
								</TradeFormField>
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
						class="flex flex-col gap-2 col-span-1 md:col-span-2"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Quantity *</FormLabel>
								<TradeFormField
									{mode}
									format="number"
									value={$formData.quantity ?? null}
								>
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
								</TradeFormField>
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

					<div
						class="flex flex-col gap-4 md:gap-6 col-span-1 md:flex-row md:col-span-3 flex-wrap"
					>
						<Field
							{form}
							name="openPrice"
							class="flex flex-col gap-2 grow-1 min-w-0 md:min-w-48"
						>
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Open Price *</FormLabel>
									<TradeFormField
										{mode}
										format="money"
										currency={calculatorCurrency}
										value={$formData.openPrice ?? null}
									>
										<Input
											{...props}
											type="number"
											class={filledInputClass}
											required
											step="0.000000001"
											min="0.000000001"
											placeholder="0.00"
											value={$formData.openPrice ?? ''}
											oninput={(e) =>
												setDecimalField('openPrice', e.currentTarget.value)}
										/>
									</TradeFormField>
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

						<Field {form} name="openedAt" class={datePickerFieldClass}>
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Opened At *</FormLabel>
									<TradeFormField
										{mode}
										format="datetime"
										value={$formData.openedAt ?? null}
									>
										<DatePicker
											{...props}
											name="openedAt"
											bind:value={$formData.openedAt}
											withTime
										/>
									</TradeFormField>
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
						class="flex flex-col gap-4 col-span-1 md:flex-row md:col-span-3 md:gap-6 flex-wrap"
					>
						<Field
							{form}
							name="closePrice"
							class="flex flex-col gap-2 grow-1 min-w-0 md:min-w-48"
						>
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Close Price</FormLabel>
									<TradeFormField
										{mode}
										format="money"
										currency={calculatorCurrency}
										value={$formData.closePrice ?? null}
									>
										<Input
											{...props}
											type="number"
											class={filledInputClass}
											step="0.000000001"
											min="0.000000001"
											placeholder="0.00"
											bind:value={$formData.closePrice}
										/>
									</TradeFormField>
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

						<Field {form} name="closedAt" class={datePickerFieldClass}>
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Closed At</FormLabel>
									<TradeFormField
										{mode}
										format="datetime"
										value={$formData.closedAt ?? null}
									>
										<DatePicker
											{...props}
											name="closedAt"
											bind:value={$formData.closedAt}
											withTime
										/>
									</TradeFormField>
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

			<section class="flex flex-col gap-6 md:gap-8">
				<div class="flex items-center gap-3">
					<div class="h-4 w-1 rounded-full bg-[#003d6d]"></div>
					<span
						class="text-sm font-bold uppercase tracking-[1.4px] text-[#1a1c1f]"
					>
						Trade Details
					</span>
				</div>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-6 md:gap-8">
					<Field
						{form}
						name="fee"
						class="flex flex-col gap-2 col-span-1 md:col-span-2"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Fee</FormLabel>
								<TradeFormField
									{mode}
									format="money"
									currency={calculatorCurrency}
									value={$formData.fee ?? null}
								>
									<Input
										{...props}
										type="number"
										class={filledInputClass}
										step="0.000000001"
										min="0"
										placeholder="Total fees (optional)"
										bind:value={$formData.fee}
									/>
								</TradeFormField>
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
						name="tags"
						class="flex md:col-span-2 flex-col gap-2 col-span-1 md:col-span-4"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Tags</FormLabel>
								<TradeFormField
									{mode}
									format="string"
									value={tradeTags}
								>
									{#each tradeTags as tag}
										<input type="hidden" name="tags" value={tag} />
									{/each}
									<div class="grid grid-cols-1 gap-4 md:grid-cols-6">
										<div class="md:col-span-3">
											<Popover.Root bind:open={tagOpen}>
												<Popover.Trigger bind:ref={tagTriggerRef}>
													{#snippet child({ props: triggerProps })}
														<Button
															{...triggerProps}
															id={props.id}
															variant="outline"
															disabled={!canAddMoreTags}
															class={cn(
																filledInputClass,
																'w-full justify-between px-3 text-left font-normal hover:bg-[#f3f3f7]',
																!canAddMoreTags && 'opacity-50',
															)}
															role="combobox"
															aria-expanded={tagOpen}
														>
															<span class="truncate text-muted-foreground">
																{canAddMoreTags
																	? 'Add tag...'
																	: 'Max tags reached'}
															</span>
															<ChevronsUpDown
																class="ml-2 size-4 shrink-0 opacity-50"
															/>
														</Button>
													{/snippet}
												</Popover.Trigger>
												<Popover.Content
													class="w-[240px] p-0"
													align="start"
													onCloseAutoFocus={(e) => e.preventDefault()}
												>
													<Command.Root shouldFilter={false}>
														<Command.Input
															class="h-9"
															placeholder="Search or enter tag..."
															bind:value={tagSearch}
															onkeydown={(event) => {
																if (event.key === 'Enter' && tagSearch.trim()) {
																	event.preventDefault();
																	event.stopPropagation();
																	selectTag(tagSearch);
																}
															}}
														/>
														<Command.List class="max-h-[220px] overflow-y-auto">
															{#if filteredTagOptions.length === 0 && !tagSearch.trim()}
																<Command.Empty>No tags found.</Command.Empty>
															{/if}
															<Command.Group>
																{#if tagSearch.trim() && !hasExactTagOption && !hasTag(tagSearch.trim())}
																	{@const pendingTag = tagSearch.trim()}
																	<Command.Item
																		value={pendingTag}
																		onSelect={() => selectTag(pendingTag)}
																		onpointerdown={(e) => e.preventDefault()}
																	>
																		Use "{pendingTag}"
																	</Command.Item>
																{/if}
																{#each filteredTagOptions as tag (tag)}
																	<Command.Item
																		value={tag}
																		onSelect={() => selectTag(tag)}
																		onpointerdown={(e) => e.preventDefault()}
																	>
																		<span>{tag}</span>
																	</Command.Item>
																{/each}
															</Command.Group>
														</Command.List>
													</Command.Root>
												</Popover.Content>
											</Popover.Root>
										</div>
										<div
											class="flex min-h-11 flex-wrap items-center gap-2 md:col-span-3"
										>
											{#each tradeTags as tag, index (tag)}
												<Badge variant="outline" class="gap-1 pr-1">
													{tag}
													<button
														type="button"
														class="rounded-sm p-0.5 hover:bg-muted"
														aria-label="Remove tag {tag}"
														onclick={() => removeTag(index)}
													>
														<X class="size-3" />
													</button>
												</Badge>
											{/each}
											{#if tradeTags.length === 0}
												<span class="text-sm text-muted-foreground">-</span>
											{/if}
										</div>
									</div>
									{#if tagInputError}
										<p class="text-destructive text-sm font-medium">
											{tagInputError}
										</p>
									{/if}
								</TradeFormField>
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
						name="comment"
						class="flex flex-col gap-2 col-span-1 md:col-span-6"
					>
						<Control>
							{#snippet children({ props })}
								<FormLabel class={fieldLabelClass}>Comment</FormLabel>
								<TradeFormField
									{mode}
									format="string"
									value={$formData.comment ?? ''}
								>
									<Textarea
										{...props}
										class={filledInputClass + ' max-h-30'}
										rows={4}
										placeholder="Enter a comment for this trade"
										bind:value={$formData.comment}
									/>
								</TradeFormField>
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

			<section class="flex flex-col gap-6 md:gap-8">
				<div class="flex items-center gap-3">
					<div class="h-4 w-1 rounded-full bg-[#003d6d]"></div>
					<span
						class="text-sm font-bold uppercase tracking-[1.4px] text-[#1a1c1f]"
					>
						Risk Management
					</span>
				</div>

				<div
					class="rounded-lg border border-[rgba(194,199,207,0.1)] bg-[rgba(243,243,247,0.3)] p-5 md:p-8 flex flex-col gap-6 md:gap-8"
				>
					<Field {form} name="useLeverage">
						<Control>
							{#snippet children({ props: useLeverageProps })}
								<Field {form} name="leverage">
									<Control>
										{#snippet children({ props: leverageProps })}
											<input
												name="useLeverage"
												type="checkbox"
												value={$formData.useLeverage}
												hidden
											/>
											<input
												name="leverage"
												value={$formData.leverage}
												hidden
											/>
											<TradeFormField
												{mode}
												format="string"
												value={leverageDisplay}
											>
												<LeverageSlider
													bind:enabled={$formData.useLeverage}
													bind:leverage={$formData.leverage}
													checkboxProps={useLeverageProps}
													sliderProps={leverageProps}
												/>
											</TradeFormField>
										{/snippet}
									</Control>
								</Field>
							{/snippet}
						</Control>
					</Field>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
						<Field {form} name="takeProfit" class="flex flex-col gap-2">
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Take Profit</FormLabel>
									<TradeFormField
										{mode}
										format="money"
										currency={calculatorCurrency}
										value={$formData.takeProfit ?? null}
									>
										<Input
											{...props}
											type="number"
											class={filledInputClass}
											step="0.000000001"
											min="0.000000001"
											placeholder="Enter target price"
											bind:value={$formData.takeProfit}
										/>
									</TradeFormField>
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

						<Field {form} name="stopLoss" class="flex flex-col gap-2">
							<Control>
								{#snippet children({ props })}
									<FormLabel class={fieldLabelClass}>Stop Loss</FormLabel>
									<TradeFormField
										{mode}
										format="money"
										currency={calculatorCurrency}
										value={$formData.stopLoss ?? null}
									>
										<Input
											{...props}
											type="number"
											class={filledInputClass}
											step="0.000000001"
											min="0.000000001"
											placeholder="Enter exit safety"
											bind:value={$formData.stopLoss}
										/>
									</TradeFormField>
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
	</div>

	{#if isWriteMode}
		<footer
			class="sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-3 border-t border-[#e2e8f0]/80 bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-8"
		>
			<Button
				variant="ghost"
				type="button"
				class="px-6 font-bold text-[#4c6076] hover:bg-transparent"
				onclick={handleCancel}
			>
				Cancel
			</Button>

			<Button
				type="button"
				class="bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
				onclick={handleSubmit}
				disabled={isArchivedPortfolio}
			>
				{isEdit ? 'Update Trade' : 'Submit Trade'}
			</Button>
		</footer>
	{/if}
</div>

{#if isWriteMode}
	<Dialog.Root bind:open={calculatorOpen}>
	<Dialog.Content class="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Position calculator</Dialog.Title>
		</Dialog.Header>
		<PositionSizeCalculator
			embedded
			initialBalance={calculatorInitialBalance}
			initialCurrency={calculatorCurrency}
		/>
	</Dialog.Content>
</Dialog.Root>
{/if}
