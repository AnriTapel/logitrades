<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		RadioGroup,
		RadioGroupItem,
		RadioGroupInput,
	} from '$lib/components/ui/radio-group';
	import { Slider } from '$lib/components/ui/slider';
	import {formSchema, type TradeFormInput} from './schema';
	import {
		type SuperValidated,
		type Infer,
		superForm,
	} from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	const { data }: {data: SuperValidated<TradeFormInput>} = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		id: 'trade-form',
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
	<section>
		<div class="form-field">
			<Form.Field {form} name="tradeType" class="form-field">
				<Form.Control let:attrs>
					<Form.Label>Trade Type *</Form.Label>
					<RadioGroup
						{...attrs}
						bind:value={$formData.tradeType}
						class="flex gap-4 mt-2"
					>
						<Form.Control let:attrs>
							<RadioGroupItem value="buy" {...attrs} />
							<Label for="tradeType-buy">Buy</Label>
						</Form.Control>
						<Form.Control let:attrs>
							<RadioGroupItem value="sell" {...attrs} />
							<Label for="tradeType-sell">Sell</Label>
						</Form.Control>
						<RadioGroupInput name="tradeType" />
					</RadioGroup>
				</Form.Control>
				<div class="form-error">
					<Form.FieldErrors />
				</div>
			</Form.Field>
		</div>

		<div class="form-field">
			<Form.Field {form} name="symbol">
				<Form.Control let:attrs>
					<Form.Label>Symbol *</Form.Label>
					<Input {...attrs} bind:value={$formData.symbol} required />
				</Form.Control>
				<div class="form-error">
					<Form.FieldErrors />
				</div>
			</Form.Field>
		</div>

		<div class="form-field">
			<Form.Field {form} name="price" class="form-field">
				<Form.Control let:attrs>
					<Form.Label>Price *</Form.Label>
					<Input
						{...attrs}
						type="number"
						min="0"
						step="0.001"
						bind:value={$formData.price}
						required
					/>
				</Form.Control>
				<div class="form-error">
					<Form.FieldErrors />
				</div>
			</Form.Field>
		</div>

		<div class="form-field">
			<Form.Field {form} name="quantity" class="form-field">
				<Form.Control let:attrs>
					<Form.Label>Quantity *</Form.Label>
					<Input
						{...attrs}
						type="number"
						min="0"
						step="0.001"
						bind:value={$formData.quantity}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</section>

	<section>
		<div class="leverage-block">
			<Form.Field {form} name="useLeverage">
				<Form.Control let:attrs>
					<div class="flex items-center gap-2">
						<Checkbox {...attrs} bind:checked={$formData.useLeverage} />
						<Form.Label>Use Leverage</Form.Label>
					</div>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="leverage">
				<Form.Control let:attrs>
					<div class="flex items-center gap-4 mt-2">
						<Form.Label>Leverage</Form.Label>
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
				</Form.Control>
				<div class="form-error">
					<Form.FieldErrors />
				</div>
			</Form.Field>
		</div>

		<div class="form-field">
			<Form.Field {form} name="takeProfit">
				<Form.Control let:attrs>
					<Form.Label>Take Profit</Form.Label>
					<Input
						{...attrs}
						type="number"
						min="0"
						step="0.001"
						bind:value={$formData.takeProfit}
					/>
				</Form.Control>
				<div class="form-error">
					<Form.FieldErrors />
				</div>
			</Form.Field>
		</div>

		<div class="form-field">
			<Form.Field {form} name="stopLoss">
				<Form.Control let:attrs>
					<Form.Label>Stop Loss</Form.Label>
					<Input
						{...attrs}
						type="number"
						min="0"
						step="any"
						bind:value={$formData.stopLoss}
					/>
				</Form.Control>
				<div class="form-error">
					<Form.FieldErrors />
				</div>
			</Form.Field>
		</div>

		<div class="form-field">
			<Form.Field {form} name="comment">
				<Form.Control let:attrs>
					<Form.Label>Comment</Form.Label>
					<Input {...attrs} bind:value={$formData.comment} />
				</Form.Control>
				<div class="form-error">
					<Form.FieldErrors />
				</div>
			</Form.Field>
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
