<script lang="ts">
	import CurrencyCombobox from '$lib/components/custom/currency-combobox.svelte';

	const currentYear = new Date().getFullYear();
	const { isAuthenticated } = $props<{ isAuthenticated: boolean }>();
</script>

<footer class="bg-background text-foreground">
	<div class="py-4 flex sm:flex-row gap-3 items-center justify-between">
		<p class="text-sm text-muted-foreground">
			&copy; 2025 - {currentYear} LogiTrades. All rights reserved.
		</p>
		{#if isAuthenticated}
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">Currency:</span>
				<CurrencyCombobox />
			</div>
		{/if}
	</div>
</footer>
