<script lang="ts">
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';
	import { Input } from '$lib/components/ui/input';
	import { importTrades } from '$lib/services/api';
	import { invalidateAll } from '$app/navigation';

	let { onCancel = () => {} } = $props<{ onCancel: () => void }>();

	let selectedFile = $state<File | null>(null);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
		}
	}

	async function handleImport() {
		if (!selectedFile) {
			return;
		}

		try {
			await importTrades(selectedFile);
			await invalidateAll();
			onCancel();
		} catch (error) {
			console.error(error);
			// TODO: Show an error message to the user
		}
	}
</script>

<CommonDialog
	open={true}
	title="Import Trades from CSV"
	subtitle="Select a CSV file to import your trades."
	submitText="Import"
	{onCancel}
	onSubmit={handleImport}
	disabled={!selectedFile}
>
	<div class="grid w-full max-w-sm items-center gap-1.5">
		<Input
			id="csv-import"
			type="file"
			accept=".csv"
			on:change={handleFileSelect}
		/>
	</div>
</CommonDialog>
