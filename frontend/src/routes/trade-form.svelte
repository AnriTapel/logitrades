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
	import { Slider } from '$lib/components/ui/slider';
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
			<Control let:attrs>
				<FormLabel>Trade Type *</FormLabel>
				<ToggleGroup
					{...attrs}
					type="single"
					bind:value={$formData.tradeType}
					options={[
						{ label: 'Long', value: 'buy' },
						{ label: 'Short', value: 'sell' },
					]}
				/>
			</Control>
		</Field>

		<Button
			type="button"
			variant="secondary"
			class="ml-auto"
			on:click={handleClearForm}>Clear</Button
		>

		<Field {form} name="symbol">
			<Control let:attrs>
				<FormLabel>Symbol *</FormLabel>
				<Input {...attrs} bind:value={$formData.symbol} required />
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="openPrice">
			<Control let:attrs>
				<FormLabel>Open Price *</FormLabel>
				<Input
					{...attrs}
					type="number"
					min="0"
					step="0.001"
					bind:value={$formData.openPrice}
					required
				/>
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="quantity">
			<Control let:attrs>
				<FormLabel>Quantity *</FormLabel>
				<Input
					{...attrs}
					type="number"
					min="0"
					step="1"
					bind:value={$formData.quantity}
					required
				/>
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="takeProfit">
			<Control let:attrs>
				<FormLabel>Take Profit</FormLabel>
				<Input
					{...attrs}
					type="number"
					min="0"
					step="0.001"
					bind:value={$formData.takeProfit}
				/>
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="stopLoss">
			<Control let:attrs>
				<FormLabel>Stop Loss</FormLabel>
				<Input
					{...attrs}
					type="number"
					min="0"
					step="any"
					bind:value={$formData.stopLoss}
				/>
			</Control>
			<FieldErrors />
		</Field>

		<div>
			<Label for="leverage">Leverage</Label>
			<div class="leverage-controls">
				<Field {form} name="useLeverage">
					<Control let:attrs>
						<div class="flex items-center gap-2">
							<input name="useLeverage" value={$formData.useLeverage} hidden />
							<Checkbox {...attrs} bind:checked={$formData.useLeverage} />
						</div>
					</Control>
				</Field>

				<Field {form} name="leverage">
					<Control let:attrs>
						<div class="flex items-center gap-4">
							<input name="leverage" value={$formData.leverage} hidden />
							<Slider
								{...attrs}
								disabled={!$formData.useLeverage}
								min={1}
								max={50}
								step={1}
								bind:value={$formData.leverage}
								class="w-24"
							/>
							<span>{$formData.leverage}x</span>
						</div>
					</Control>
				</Field>
			</div>
		</div>

		<Field {form} name="openedAt">
			<Control let:attrs>
				<DatePicker
					{...attrs}
					name="openedAt"
					bind:value={$formData.openedAt}
					withTime
					label="Opened at*"
				/>
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="closePrice">
			<Control let:attrs>
				<FormLabel>Close Price</FormLabel>
				<Input
					{...attrs}
					type="number"
					min="0"
					step="0.001"
					bind:value={$formData.closePrice}
				/>
			</Control>
			<FieldErrors />
		</Field>

		<Field {form} name="closedAt">
			<Control let:attrs>
				<DatePicker
					{...attrs}
					name="closedAt"
					bind:value={$formData.closedAt}
					withTime
					label="Closed at"
				/>
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
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-top: 1rem;
	}
</style>
