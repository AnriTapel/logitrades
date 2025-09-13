<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import DataTableActions from './trades-table-actions.svelte';
	import {
		TradeTypeCell,
		StatusBadge,
		PnLDisplay,
		TpSLDisplay,
		TradeDatesDisplay,
	} from '$lib';
	import { formatIntToCurrency } from '$lib/formatters';
	import {
		createTable,
		Render,
		Subscribe,
		createRender,
	} from 'svelte-headless-table';
	import { tradesStore } from '$lib/stores/trades';
	const {
		onDelete,
		onEdit,
	}: {
		onDelete: (tradeId: number) => void;
		onEdit: (tradeId: number) => void;
	} = $props();

	const table = createTable(tradesStore);

	const columns = table.createColumns([
		table.column({
			accessor: 'symbol',
			header: 'Symbol',
		}),
		table.column({
			accessor: ({ closePrice }) => closePrice,
			header: 'Status',
			cell: ({ value }) =>
				createRender(StatusBadge, { status: value ? 'closed' : 'open' }),
		}),
		table.column({
			accessor: 'tradeType',
			header: 'Type',
			cell: ({ value }) => createRender(TradeTypeCell, { tradeType: value }),
		}),
		table.column({
			accessor: 'quantity',
			header: 'Quantity',
		}),
		table.column({
			accessor: 'openPrice',
			header: 'Open Price',
			cell: ({ value }) => formatIntToCurrency(value),
		}),
		table.column({
			accessor: 'leverage',
			header: 'Leverage',
			cell: ({ value }) => (value ? `${value}x` : '-'),
		}),
		table.column({
			accessor: ({ takeProfit, stopLoss }) => ({ takeProfit, stopLoss }),
			header: 'TP/SL',
			cell: ({ value }) =>
				createRender(TpSLDisplay, {
					takeProfit: value.takeProfit,
					stopLoss: value.stopLoss,
				}),
		}),
		table.column({
			accessor: 'closePrice',
			header: 'Close Price',
			cell: ({ value }) => (value ? formatIntToCurrency(value) : '-'),
		}),
		table.column({
			accessor: ({ openedAt, closedAt }) => ({ openedAt, closedAt }),
			header: 'Trade Dates',
			cell: ({ value }) =>
				createRender(TradeDatesDisplay, {
					openedAt: value.openedAt,
					closedAt: value.closedAt,
				}),
		}),

		table.column({
			accessor: (trade) => ({
				trade,
			}),
			header: 'P&L',
			cell: ({ value }) => createRender(PnLDisplay, { trade: value.trade }),
		}),
		table.column({
			accessor: ({ id }) => id,
			header: '',
			cell: ({ value }) => {
				return createRender(DataTableActions, {
					id: value.toString(),
					onEdit,
					onDelete,
				});
			},
		}),
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
		table.createViewModel(columns);
</script>

<Table.Root {...$tableAttrs}>
	<Table.Header>
		{#each $headerRows as headerRow}
			<Subscribe rowAttrs={headerRow.attrs()}>
				<Table.Row>
					{#each headerRow.cells as cell (cell.id)}
						<Subscribe
							attrs={cell.attrs()}
							let:attrs
							props={cell.props()}
							let:props
						>
							<Table.Head {...attrs}>
								<div class={`col-${cell.id}`}>
									<Render of={cell.render()} />
								</div>
							</Table.Head>
						</Subscribe>
					{/each}
				</Table.Row>
			</Subscribe>
		{/each}
	</Table.Header>

	<Table.Body {...$tableBodyAttrs}>
		{#each $pageRows as row (row.id)}
			<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
				<Table.Row {...rowAttrs}>
					{#each row.cells as cell (cell.id)}
						<Subscribe attrs={cell.attrs()} let:attrs>
							<Table.Cell {...attrs}>
								<div class={`col-${cell.id}`}>
									<Render of={cell.render()} />
								</div>
							</Table.Cell>
						</Subscribe>
					{/each}
				</Table.Row>
			</Subscribe>
		{/each}
	</Table.Body>
</Table.Root>

<style>
	.col-id,
	.col-symbol,
	.col-quantity,
	.col-leverage {
		width: 60px;
	}
</style>
