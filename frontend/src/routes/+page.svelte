<script lang="ts">
	import { deleteTrade } from '$lib';
	import type { PageData } from './$types';
	import TradeForm from './trade-form.svelte';
	import TradesTable from './trades-table.svelte';

	let { data } = $props<{ data: PageData }>();

	async function handleTradeDelete(tradeId: number) {
		await deleteTrade(tradeId);
	}
</script>

<TradeForm data={data.form} />

<TradesTable trades={data.trades} onDelete={handleTradeDelete} />
