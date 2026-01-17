<script lang="ts">
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { Label } from '$lib/components/ui/label';
	import { formSchema, type TradeFormInput } from '$lib/schemas/tradeSchemas';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { DatePicker } from '$lib';
	import ToggleGroup from '$lib/components/custom/toggle-group.svelte';
	import { showServerErrors } from '$lib/stores/error';
	import type { HttpError } from '$lib/server/http-client/types';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import { cn } from '$lib/utils';

	export const {
		data,
		isEdit = false,
		onCancel,
	}: {
		data: SuperValidated<TradeFormInput>;
		isEdit?: boolean;
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

	const modalTitle = isEdit
		? `Edit Trade Note #${$formData.id}`
		: 'Create Trade Note';

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
</script>

<CommonDialog
	open
	title={modalTitle}
	onSubmit={handleSubmit}
	onCancel={handleCancel}
	class="w-[960px]"
>
	<form method="POST" use:enhance action={isEdit ? '?/update' : '?/create'}>
		<!-- TODO: remove this inputs -->
		{#if isEdit && $formData.id}
			<input type="hidden" name="id" value={$formData.id} />
		{/if}

		{#if isEdit && $formData.id}
			<input type="hidden" name="createdAt" value={$formData.createdAt} />
		{/if}

		<section>
			<Label class="text-gray-500">Trade Setup</Label>
			<Field {form} name="tradeType" class="mb-2">
				<Control>
					{#snippet children({ props })}
						<FormLabel>Side *</FormLabel>
						<ToggleGroup
							{...props}
							name="tradeType"
							bind:value={$formData.tradeType}
							options={[
								{ label: 'Long', value: 'buy' },
								{ label: 'Short', value: 'sell' },
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

			<div class="flex gap-2">
				<Field {form} name="symbol" class="flex-1">
					<Control>
						{#snippet children({ props })}
							<FormLabel>Symbol *</FormLabel>
							<Input
								{...props}
								class="uppercase"
								required
								placeholder="e.g. AAPL"
								bind:value={$formData.symbol}
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

				<Field {form} name="quantity" class="flex-1">
					<Control>
						{#snippet children({ props })}
							<FormLabel>Quantity *</FormLabel>
							<Input
								{...props}
								type="number"
								required
								step="0.000000001"
								min="0.000000001"
								placeholder="0"
								bind:value={$formData.quantity}
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

		<section>
			<Label class="text-gray-500">Risk Management</Label>
			<div class="mb-4">
				<Label for="leverage">Leverage</Label>
				<div class="leverage-controls">
					<Field {form} name="useLeverage">
						<Control>
							{#snippet children({ props })}
								<div class="flex items-center gap-2">
									<input
										name="useLeverage"
										type="checkbox"
										value={$formData.useLeverage}
										hidden
									/>
									<Checkbox {...props} bind:checked={$formData.useLeverage} />
								</div>
							{/snippet}
						</Control>
					</Field>

					<span
						class={cn('text-sm font-medium block w-[30px]', {
							'text-gray-500': !$formData.useLeverage,
						})}
					>
						{$formData.leverage}x
					</span>

					<Field {form} name="leverage" class="grow ">
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
							{/snippet}
						</Control>
					</Field>
				</div>
			</div>

			<div class="flex gap-2">
				<Field {form} name="takeProfit" class="flex-1">
					<Control>
						{#snippet children({ props })}
							<FormLabel>Take Profit</FormLabel>
							<Input
								{...props}
								type="number"
								step="0.000000001"
								min="0.000000001"
								placeholder="0"
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

				<Field {form} name="stopLoss" class="flex-1">
					<Control>
						{#snippet children({ props })}
							<FormLabel>Stop Loss</FormLabel>
							<Input
								{...props}
								type="number"
								step="0.000000001"
								min="0.000000001"
								placeholder="0"
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
		</section>

		<section>
			<Label class="text-gray-500">Entry & Exit</Label>
			<div class="flex gap-2 mb-8">
				<Field {form} name="openPrice" class="flex-grow">
					<Control>
						{#snippet children({ props })}
							<FormLabel>Open Price *</FormLabel>
							<Input
								{...props}
								type="number"
								required
								step="0.000000001"
								min="0.000000001"
								placeholder="0"
								bind:value={$formData.openPrice}
							/>
						{/snippet}
					</Control>
					<FieldErrors>
						{#snippet children({ errors })}
							<div class="text-destructive text-sm font-medium absolute">
								{errors[0]}
							</div>
						{/snippet}
					</FieldErrors>
				</Field>

				<Field {form} name="openedAt">
					<Control>
						{#snippet children({ props })}
							<DatePicker
								{...props}
								name="openedAt"
								bind:value={$formData.openedAt}
								withTime
								label="Opened at*"
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

			<div class="flex gap-2">
				<Field {form} name="closePrice" class="flex-grow">
					<Control>
						{#snippet children({ props })}
							<FormLabel>Close Price</FormLabel>
							<Input
								{...props}
								type="number"
								step="0.000000001"
								min="0.000000001"
								placeholder="0"
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

				<Field {form} name="closedAt">
					<Control>
						{#snippet children({ props })}
							<DatePicker
								{...props}
								name="closedAt"
								bind:value={$formData.closedAt}
								withTime
								label="Closed at"
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
		</section>
	</form>
</CommonDialog>

<style>
	form {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 250px);
		column-gap: 8rem;
	}

	.leverage-controls {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-top: 0.5rem;
	}
</style>
