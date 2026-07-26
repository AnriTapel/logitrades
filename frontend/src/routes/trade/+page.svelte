<script lang="ts">
	import type { PageData } from './$types';
	import TradeForm from '$lib/layouts/trade-form.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.isEditMode ? 'Edit Trade' : 'New Trade'} | LogiTrades</title>
</svelte:head>

<TradeForm
	data={data.form}
	existingSymbols={data.facets.symbols}
	existingTags={data.facets.tags}
	isEdit={data.isEditMode}
	portfolios={data.portfolios ?? []}
	activePortfolioId={data.portfolioId}
	plan={data.plan ?? 'free'}
/>
