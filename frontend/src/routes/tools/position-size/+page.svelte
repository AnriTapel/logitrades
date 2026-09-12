<script lang="ts">
	import type { PageProps } from './$types';
	import PositionSizeCalculator from '$lib/components/custom/position-size-calculator.svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Position Size Calculator | LogiTrades</title>
</svelte:head>

<section class="flex flex-col gap-8 max-w-3xl">
	<div class="flex flex-col gap-1">
		<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
			Tools
		</p>
		<h1 class="text-2xl font-extrabold tracking-tight text-[#1a1c1f]">
			Position Size Calculator
		</h1>
		<p class="text-sm text-[#64748b]">
			Estimate position size, notional exposure, and required margin from your
			risk parameters. Results are computed locally in your browser.
		</p>
	</div>

	<PositionSizeCalculator
		initialBalance={data.initialBalance}
		initialCurrency={data.displayCurrency}
	/>
</section>
