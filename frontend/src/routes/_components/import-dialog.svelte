<script lang="ts">
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';
	import { Input } from '$lib/components/ui/input';
	import { importTrades } from '$lib/services/api';
	import { invalidateAll } from '$app/navigation';
    import {showServerErrors} from "$lib/stores/error";
    import type {HttpError} from "$lib/services/http-client/types";

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
		} catch (e) {
            showServerErrors(e as HttpError);
        }
	}

	function downloadCSVTemplate() {
		const link = document.createElement('a');
		link.href = '/trade_import_template.csv';
		link.download = 'trade_import_template.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
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
	<p class="text-sm text-muted-foreground mb-2">
		Not sure about the format?
		<button class="text-primary hover:underline" onclick={downloadCSVTemplate}>
			Download a template
		</button>
	</p>

	<Input
		id="csv-import"
		type="file"
		accept=".csv"
		on:change={handleFileSelect}
	/>
</CommonDialog>
