<script lang="ts">
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { invalidateAll } from '$app/navigation';
	import { showServerErrors } from '$lib/stores/error';
	import type { HttpError } from '$lib/server/http-client/types';
	import { Root, Trigger, Item, Content } from '$lib/components/ui/select';
	import { deserialize } from '$app/forms';

	let { onCancel = () => {} } = $props<{ onCancel: () => void }>();

	let selectedFile = $state<File | null>(null);
	let selectedFileFields = $state<string[]>([]);

	// Fields matching backend TradeImport model
	type FieldConfig = { label: string; value: string | null; required: boolean };

	let fieldsMapping = $state<Record<string, FieldConfig>>({
		symbol: { label: 'Symbol', value: null, required: true },
		trade_type: { label: 'Trade Type', value: null, required: true },
		open_price: { label: 'Open Price', value: null, required: true },
		quantity: { label: 'Quantity', value: null, required: true },
		opened_at: { label: 'Opened at', value: null, required: false },
		close_price: { label: 'Close Price', value: null, required: false },
		closed_at: { label: 'Closed at', value: null, required: false },
		take_profit: { label: 'Take Profit', value: null, required: false },
		stop_loss: { label: 'Stop Loss', value: null, required: false },
		leverage: { label: 'Leverage', value: null, required: false },
		created_at: { label: 'Created at', value: null, required: false },
	});

	async function parseCSVHeaders(file: File): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				const firstLine = text.split('\n')[0];
				const headers = firstLine
					.split(',')
					.map((h) => h.trim().replace(/^["']|["']$/g, ''));
				resolve(headers);
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	}

	function resetMapping() {
		for (const key of Object.keys(fieldsMapping)) {
			fieldsMapping[key].value = null;
		}
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
			resetMapping();
			try {
				selectedFileFields = await parseCSVHeaders(selectedFile);
				for (const [key, field] of Object.entries(fieldsMapping)) {
					const match = selectedFileFields.find(
						(h) => h.toLowerCase() === key.toLowerCase()
					);
					if (match) {
						field.value = match;
					}
				}
			} catch {
				selectedFileFields = [];
			}
		}
	}

	$effect(() => {
		// Check if all required fields are mapped
		const allRequiredMapped = Object.values(fieldsMapping)
			.filter((f) => f.required)
			.every((f) => f.value !== null);
		canSubmit = selectedFile !== null && allRequiredMapped;
	});

	let canSubmit = $state(false);

	async function handleImport() {
		if (!selectedFile || !canSubmit) {
			return;
		}

		const formData = new FormData();
		formData.append('file', selectedFile);

		const mapping: Record<string, string> = {};
		for (const [backendField, config] of Object.entries(fieldsMapping)) {
			if (config.value) {
				mapping[backendField] = config.value;
			}
		}

		formData.append('mapping', JSON.stringify(mapping));

		try {
			const response = await fetch('?/import', {
				method: 'POST',
				body: formData,
			});

			const result = deserialize(await response.text());

			if (result.type === 'success') {
				await invalidateAll();
				onCancel();
			} else if (result.type === 'failure') {
				showServerErrors(result.data?.error as HttpError);
			}
		} catch (error) {
			showServerErrors({
				code: 500,
				reason: 'Failed to import',
				details: 'Unknown error',
			});
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
	class="w-[720px]"
	{onCancel}
	onSubmit={handleImport}
	disabled={!canSubmit}
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
		onchange={handleFileSelect}
	/>

	{#if selectedFile && selectedFileFields.length > 0}
		<div class="mt-4 space-y-3">
			<p class="text-sm font-medium">Map CSV columns to trade fields</p>

			<div class="grid grid-cols-2 grid-rows-6 grid-flow-col gap-x-6 gap-y-2">
				{#each Object.entries(fieldsMapping) as [key, item]}
					<div class="flex items-center gap-3">
						<Label class="w-24 text-sm shrink-0">
							{item.label}
							{#if item.required}
								<span class="text-destructive">*</span>
							{/if}
						</Label>
						<Root
							type="single"
							value={item.value ?? undefined}
							onValueChange={(value: string | null) => {
								fieldsMapping[key].value = value;
							}}
						>
							<Trigger class="w-[180px]" placeholder="Select column"
								><span>{item.value ?? '— None —'}</span></Trigger
							>
							<Content>
								<Item value={null} label="— None —">— None —</Item>
								{#each selectedFileFields as field}
									<Item value={field} label={field}>
										{field}
									</Item>
								{/each}
							</Content>
						</Root>
					</div>
				{/each}
			</div>

			<p class="text-xs text-muted-foreground">
				<span class="text-destructive">*</span> Required fields
			</p>
		</div>
	{/if}
</CommonDialog>
