<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import TradeForm from '$lib/layouts/trade-form.svelte';
	import { convertUiTradeToTradeFormInput } from '$lib/tradeConverters';
	import type { TradeFormData } from '$lib/schemas/tradeSchemas';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { Portfolio, PortfolioSummary, Trade } from '$lib/types';

	let {
		open = $bindable(false),
		trade,
		existingSymbols,
		existingTags,
		portfolios = [],
		activePortfolioId = undefined,
		plan = 'free',
		portfolioSummary = null,
		onEdit,
		onDelete,
		onClose,
	}: {
		open: boolean;
		trade: Trade | null;
		existingSymbols: string[];
		existingTags: string[];
		portfolios?: Portfolio[];
		activePortfolioId?: number;
		plan?: string;
		portfolioSummary?: PortfolioSummary | null;
		onEdit: (tradeId: number) => void;
		onDelete: (tradeId: number) => void;
		onClose: () => void;
	} = $props();

	const formData = $derived.by((): SuperValidated<TradeFormData> | null => {
		if (!trade) return null;

		return {
			id: 'trade-details',
			valid: true,
			posted: false,
			errors: {},
			data: convertUiTradeToTradeFormInput(trade),
			constraints: {},
		};
	});

	function handleEdit(): void {
		trade && onEdit(trade.id);
	}

	function handleDelete(): void {
		trade && onDelete(trade.id);
	}
</script>

<Dialog.Root {open}>
	<Dialog.Content
		class="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden"
	>
		<Dialog.Header>
			<Dialog.Title>Trade #{trade?.id} Details</Dialog.Title>
		</Dialog.Header>

		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if formData && trade}
				{#key trade.id}
					<TradeForm
						data={formData}
						{existingSymbols}
						{existingTags}
						isEdit
						{portfolios}
						{activePortfolioId}
						{plan}
						{portfolioSummary}
						mode="read"
					/>
				{/key}
			{/if}
		</div>

		<Dialog.Footer class="gap-2">
			<Button variant="link" type="button" onclick={onClose}>Close</Button>
			<Button variant="outline" type="button" onclick={handleEdit}>Edit</Button>
			<Button variant="destructive" type="button" onclick={handleDelete}>
				Delete
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
