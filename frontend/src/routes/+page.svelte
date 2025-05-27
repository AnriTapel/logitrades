<script lang="ts">
	import type { PageData } from './$types';
	import TradeForm from './trade-form.svelte';
	import TradesTable from './trades-table.svelte';

	export let data: PageData;
</script>

<TradeForm data={data.form} />

<TradesTable trades={data.trades} />
