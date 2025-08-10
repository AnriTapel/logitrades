<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { deleteTrade } from '$lib';
	import type { PageData } from './$types';
	import TradeForm from './trade-form.svelte';
	import TradesTable from './trades-table.svelte';
	import { tradesStore } from '$lib/stores/trades';

	let { data } = $props<{ data: PageData }>();

	$effect(() => {
		tradesStore.set(data.trades);
	});

	async function handleTradeDelete(tradeId: number) {
		await deleteTrade(tradeId);
		await invalidateAll();
	}
</script>

<TradeForm data={data.form} />

<TradesTable trades={tradesStore} onDelete={handleTradeDelete} />
