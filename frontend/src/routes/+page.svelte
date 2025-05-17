<script lang="ts">
	import TextField, { HelperLine } from '@smui/textfield';
	import Select, { Option } from '@smui/select';
	import Checkbox from '@smui/checkbox';
	import Slider from '@smui/slider';
	import Button from '@smui/button';

	type TradeFormErrors = {
		ticker?: string;
		tradeType?: string;
		price?: string;
		amount?: string;
		leverage?: string;
	};

	let ticker = '';
	let tradeType = '';
	let price = '';
	let amount = '';
	let useLeverage = false;
	let leverage = 1;
	let comment = '';

	let errors: TradeFormErrors = {};

	function handleSubmit() {
		errors = {};
		if (!ticker) errors.ticker = 'Ticker is required';
		if (!tradeType) errors.tradeType = 'Trade type is required';
		if (!price) errors.price = 'Price is required';
		if (!amount) errors.amount = 'Amount is required';
		if (useLeverage && (leverage < 1 || leverage > 100)) {
			errors.leverage = 'Leverage must be between 1 and 100';
		}
		if (Object.keys(errors).length === 0) {
			console.log({
				ticker,
				type: tradeType,
				price,
				amount,
				leverage: useLeverage ? leverage : undefined,
				comment,
			});
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="trade-form">
	<TextField
		label="Ticker"
		bind:value={ticker}
		required
		variant="outlined"
		invalid={!!errors.ticker}
		input$style="text-transform: uppercase"
	/>
	<Select
		label="Trade Type"
		bind:value={tradeType}
		required
		variant="outlined"
		invalid={!!errors.tradeType}
	>
		<Option value="buy">Buy</Option>
		<Option value="sell">Sell</Option>
	</Select>

	<TextField
		label="Price"
		bind:value={price}
		required
		type="number"
		variant="outlined"
		input$min="0"
		invalid={!!errors.price}
	>
		{#if errors.price}
			<HelperLine>Error in the field</HelperLine>
		{/if}
	</TextField>

	<TextField
		label="Amount"
		bind:value={amount}
		required
		type="number"
		input$min="0"
		variant="outlined"
		invalid={!!errors.amount}
	/>
	<div class="leverage-row">
		<Checkbox bind:checked={useLeverage} />
		<label for={'leverage'}>Use Leverage</label>
		{#if useLeverage}
			<Slider
				bind:value={leverage}
				min={1}
				max={100}
				step={1}
				class="leverage-slider"
			/>
			<span>{leverage}x</span>
			{#if errors.leverage}
				<div class="error">{errors.leverage}</div>
			{/if}
		{/if}
	</div>
	<TextField
		label="Comment"
		bind:value={comment}
		variant={'outlined'}
		textarea
	/>
	<Button type="submit" variant="raised">Submit Trade</Button>
</form>

<style>
	.trade-form {
		max-width: 400px;
		margin: 2rem auto;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}
	.leverage-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		:global(.leverage-slider) {
			width: 120px;
			flex-shrink: 0;
			margin: 0 1rem;
		}
	}
	.error {
		color: red;
		font-size: 0.9em;
		margin-left: 0.5em;
	}
</style>
