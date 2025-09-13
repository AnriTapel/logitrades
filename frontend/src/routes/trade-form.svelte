<script lang="ts">
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { Label } from '$lib/components/ui/label';
	import { formSchema, type TradeFormInput } from './schema';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { DatePicker } from '$lib';
	import Button from '$lib/components/ui/button/button.svelte';
	import ToggleGroup from '$lib/components/custom/toggle-group.svelte';

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
			// Check if operation was successful (no validation errors or server errors)
			if (result.type === 'success') {
				onCancel();
			}
		},
	});

	const { form: formData, enhance } = form;

	const modalTitle = isEdit
		? `Edit Trade Note #${$formData.id}`
		: 'Create Trade Note';

	const handleSubmit = async (): Promise<void> => {
		const result = await form.validateForm();

		if (!result.valid) {
			return form.errors.set(result.errors);
		}

		form.submit();
		onCancel();
	};

	const handleCancel = (): void => {
		form.reset();
		onCancel();
	};

	const handleClearForm = (): void => {
		form.reset();
	};
</script>

<CommonDialog
	open
	title={modalTitle}
	onSubmit={handleSubmit}
	onCancel={handleCancel}
>
	<form method="POST" use:enhance action={isEdit ? '?/update' : '?/create'}>
		{#if isEdit && $formData.id}
			<input type="hidden" name="id" value={$formData.id} />
		{/if}

		<Field {form} name="tradeType" class="col-span-2">
			<Control>
				{#snippet children({ props })}
					<FormLabel>Trade Type *</FormLabel>
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
		</Field>

		<Button
			type="button"
			variant="secondary"
			class="ml-auto"
			onclick={handleClearForm}>Clear</Button
		>

		<Field {form} name="symbol">
			<Control>
				{#snippet children({ props })}
					<FormLabel>Symbol *</FormLabel>
					<Input {...props} bind:value={$formData.symbol} required />
				{/snippet}
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="openPrice">
			<Control>
				{#snippet children({ props })}
					<FormLabel>Open Price *</FormLabel>
					<Input
						{...props}
						type="number"
						min="0"
						step="0.001"
						bind:value={$formData.openPrice}
						required
					/>
				{/snippet}
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="quantity">
			<Control>
				{#snippet children({ props })}
					<FormLabel>Quantity *</FormLabel>
					<Input
						{...props}
						type="number"
						min="0.1"
						step="0.1"
						bind:value={$formData.quantity}
						required
					/>
				{/snippet}
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="takeProfit">
			<Control>
				{#snippet children({ props })}
					<FormLabel>Take Profit</FormLabel>
					<Input
						{...props}
						type="number"
						min="0"
						step="0.001"
						bind:value={$formData.takeProfit}
					/>
				{/snippet}
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="stopLoss">
			<Control>
				{#snippet children({ props })}
					<FormLabel>Stop Loss</FormLabel>
					<Input
						{...props}
						type="number"
						min="0"
						step="any"
						bind:value={$formData.stopLoss}
					/>
				{/snippet}
			</Control>
			<FieldErrors />
		</Field>

		<div>
			<Label for="leverage">Leverage</Label>
			<div class="leverage-controls">
				<Field {form} name="useLeverage">
					<Control>
						{#snippet children({ props })}
							<div class="flex items-center gap-2">
								<input
									name="useLeverage"
									value={$formData.useLeverage}
									hidden
								/>
								<Checkbox {...props} bind:checked={$formData.useLeverage} />
							</div>
						{/snippet}
					</Control>
				</Field>

				<Field {form} name="leverage" class="grow">
					<Control>
						{#snippet children({ props })}
							<Input
								{...props}
								name="leverage"
								type="number"
								min={1}
								max={50}
								step={1}
								disabled={!$formData.useLeverage}
								bind:value={$formData.leverage}
							/>
						{/snippet}
					</Control>
				</Field>
			</div>
		</div>

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
			<FieldErrors />
		</Field>

		<Field {form} name="closePrice">
			<Control>
				{#snippet children({ props })}
					<FormLabel>Close Price</FormLabel>
					<Input
						{...props}
						type="number"
						min="0"
						step="0.001"
						bind:value={$formData.closePrice}
					/>
				{/snippet}
			</Control>
			<FieldErrors />
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
			<FieldErrors />
		</Field>
	</form>
</CommonDialog>

<style>
	form {
		display: grid;
		grid-template-columns: repeat(3, 250px);
		grid-template-rows: 6rem repeat(3, 6.5rem);
		column-gap: 2rem;
		margin-inline: auto;
	}

	.leverage-controls {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-top: 1rem;
	}
</style>
