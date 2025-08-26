<script lang="ts">
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { Label } from '$lib/components/ui/label';
	import {
		RadioGroup,
		RadioGroupItem,
		RadioGroupInput,
	} from '$lib/components/ui/radio-group';
	import { formSchema, type TradeFormInput } from './schema';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import { Slider } from '$lib/components/ui/slider';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import DatePicker from '$lib/components/custom/date-picker.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	export const {
		data,
		open = false,
		onCancel,
	}: {
		data: SuperValidated<TradeFormInput>;
		open?: boolean;
		onCancel: () => void;
	} = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		id: 'trade-form',
	});

	const { form: formData, enhance } = form;

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
	{open}
	title="Create Trade Note"
	onSubmit={handleSubmit}
	onCancel={handleCancel}
>
	<form method="POST" use:enhance>
		<Field {form} name="tradeType" class="col-span-2">
			<Control let:attrs>
				<FormLabel>Trade Type *</FormLabel>
				<RadioGroup
					{...attrs}
					bind:value={$formData.tradeType}
					class="flex gap-4 mt-2"
				>
					<Control let:attrs>
						<RadioGroupItem value="buy" {...attrs} />
						<Label for="tradeType-buy">Buy</Label>
					</Control>
					<Control let:attrs>
						<RadioGroupItem value="sell" {...attrs} />
						<Label for="tradeType-sell">Sell</Label>
					</Control>
					<RadioGroupInput name="tradeType" />
				</RadioGroup>
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

		<Field {form} name="price">
			<Control let:attrs>
				<FormLabel>Price *</FormLabel>
				<Input
					{...attrs}
					type="number"
					min="0"
					step="0.001"
					bind:value={$formData.price}
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

		<Field {form} name="comment">
			<Control let:attrs>
				<FormLabel>Comment</FormLabel>
				<Input {...attrs} bind:value={$formData.comment} />
			</Control>
			<FieldErrors />
		</Field>
	</form>
</CommonDialog>

<style>
	form {
		display: grid;
		grid-template-columns: repeat(3, 250px);
		grid-template-rows: 5rem repeat(3, 6.5rem);
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
