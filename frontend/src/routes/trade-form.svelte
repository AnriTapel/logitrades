<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Field,
		Control,
		Label as FormLabel,
		FieldErrors,
	} from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import DatePicker from '$lib/components/custom/date-picker.svelte';
	import {
		RadioGroup,
		RadioGroupItem,
		RadioGroupInput,
	} from '$lib/components/ui/radio-group';
	import { Slider } from '$lib/components/ui/slider';
	import { formSchema, type TradeFormInput } from './schema';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	const { data }: { data: SuperValidated<TradeFormInput> } = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		id: 'trade-form',
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
	<section>
		<div class="form-field">
			<Field {form} name="tradeType" class="form-field">
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
				<div class="form-error">
					<FieldErrors />
				</div>
			</Field>
		</div>

		<div class="form-field">
			<Field {form} name="symbol">
				<Control let:attrs>
					<FormLabel>Symbol *</FormLabel>
					<Input {...attrs} bind:value={$formData.symbol} required />
				</Control>
				<div class="form-error">
					<FieldErrors />
				</div>
			</Field>
		</div>

		<div class="form-field">
			<Field {form} name="price" class="form-field">
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
				<div class="form-error">
					<FieldErrors />
				</div>
			</Field>
		</div>

		<div class="form-field">
			<Field {form} name="quantity" class="form-field">
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
		</div>

		<div class="form-field">
			<Field {form} name="openedAt" class="form-field">
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
		</div>
	</section>

	<section>
		<div class="leverage-block">
			<Field {form} name="useLeverage">
				<Control let:attrs>
					<div class="flex items-center gap-2">
						<input name="useLeverage" value={$formData.useLeverage} hidden />
						<Checkbox {...attrs} bind:checked={$formData.useLeverage} />
						<FormLabel>Use Leverage</FormLabel>
					</div>
				</Control>
			</Field>

			<Field {form} name="leverage">
				<Control let:attrs>
					<div class="flex items-center gap-4 mt-2">
						<FormLabel>Leverage</FormLabel>
						<input name="leverage" value={$formData.leverage} hidden />
						<Slider
							{...attrs}
							disabled={!$formData.useLeverage}
							min={1}
							max={50}
							step={1}
							bind:value={$formData.leverage}
							class="w-20"
						/>
						<span>{$formData.leverage}x</span>
					</div>
				</Control>
				<div class="form-error">
					<FieldErrors />
				</div>
			</Field>
		</div>

		<div class="form-field">
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
				<div class="form-error">
					<FieldErrors />
				</div>
			</Field>
		</div>

		<div class="form-field">
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
				<div class="form-error">
					<FieldErrors />
				</div>
			</Field>
		</div>

		<div class="form-field">
			<Field {form} name="comment">
				<Control let:attrs>
					<FormLabel>Comment</FormLabel>
					<Input {...attrs} bind:value={$formData.comment} />
				</Control>
				<div class="form-error">
					<FieldErrors />
				</div>
			</Field>
		</div>

		<Button type="submit">Submit Trade</Button>
	</section>
</form>

<style>
	form {
		display: flex;
		padding-top: 2rem;
		padding-inline: 2rem;
		gap: 2rem;
		max-width: 600px;
		margin-inline: auto;
	}

	form > section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		min-height: 5.5rem; /* Ensures space for label, input, and error */
	}

	.form-error {
		min-height: 1.25rem; /* Reserve space for error messages */
		color: #dc2626; /* Tailwind's red-600 */
		font-size: 0.95em;
		margin-top: 0.25rem;
	}

	.leverage-block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
</style>
