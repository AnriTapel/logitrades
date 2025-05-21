<script lang="ts">
	import TextField from '@smui/textfield';
	import Select, { Option } from '@smui/select';
	import Checkbox from '@smui/checkbox';
	import Slider from '@smui/slider';
	import Button from '@smui/button';

	import type { PageProps } from './$types';

	import { enhance } from '$app/forms';

	// Trades list onMount
	let { data }: PageProps = $props();

	type TradeFormErrors = {
		ticker?: string;
		tradeType?: string;
		price?: string;
		takeProfit?: string;
		stopLoss?: string;
		amount?: string;
		leverage?: string;
	};

	let symbol: string | null = $state(null);
	// let tradeType: 'buy' | 'sell' = $state('buy');
	let tradeType: 'buy' | 'sell' = $state('buy');
	let price: number | null = $state(null);
	let amount: number | null = $state(null);
	let useLeverage: boolean = $state(false);
	let leverage: number = $state(1);
	let takeProfit: number | null = $state(null);
	let stopLoss: number | null = $state(null);
	let comment: string | null = $state(null);
</script>

<form method="POST" class="trade-form" use:enhance>
	<TextField
		label="Ticker"
		input$name="symbol"
		bind:value={symbol}
		required
		variant="outlined"
		input$style="text-transform: uppercase"
	/>

	<Select
		label="Trade Type"
		input$name="type"
		bind:value={tradeType}
		required
		variant="outlined"
	>
		<Option value="buy">Buy</Option>
		<Option value="sell">Sell</Option>
	</Select>
	<input type="hidden" name="type" value={tradeType} />

	<TextField
		label="Price"
		input$name="price"
		bind:value={price}
		required
		type="number"
		variant="outlined"
		input$min="0"
		input$step="0.0001"
	/>

	<TextField
		label="Quantity"
		input$name="quantity"
		bind:value={amount}
		required
		type="number"
		input$min="0"
		variant="outlined"
	/>

	<TextField
		label="Take Profit"
		input$name="take_profit"
		bind:value={takeProfit}
		type="number"
		variant="outlined"
		input$min="0"
		input$step="0.0001"
	/>

	<TextField
		label="Stop Loss"
		input$name="stop_loss"
		bind:value={stopLoss}
		type="number"
		variant="outlined"
		input$min="0"
		input$step="0.0001"
	/>

	<div class="leverage-row">
		<Checkbox input$name="use_leverage" bind:checked={useLeverage} />
		<label for="use_leverage">Use Leverage</label>
		{#if useLeverage}
			<Slider
				bind:value={leverage}
				input$name="leverage"
				min={1}
				max={100}
				step={1}
				class="leverage-slider"
			/>
			<span>{leverage}x</span>
		{/if}
	</div>
	<TextField
		label="Comment"
		input$name="comment"
		bind:value={comment}
		variant={'outlined'}
		input$max="64"
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
</style>
