<script lang="ts">
	import type { PageData } from './$types';
	import TradeForm from './trade-form.svelte';

	export let data: PageData;
</script>

<TradeForm data={data.form} />
