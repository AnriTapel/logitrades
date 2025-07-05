<script lang="ts">
	import type { Trade } from '$lib/types';

	import * as Table from '$lib/components/ui/table';
	import DataTableActions from './trades-table-actions.svelte';
	import TradeTypeCell from '$lib/components/custom/trade-type-cell.svelte';
	import { formatIntToCurrency, formatISOToDateTimeStr } from '$lib/formatters';
	import {
		createTable,
		Render,
		Subscribe,
		createRender,
	} from 'svelte-headless-table';
	import { readable } from 'svelte/store';
	import { addSortBy } from 'svelte-headless-table/plugins';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import { Button } from '$lib/components/ui/button';

	const {
		trades,
		onDelete,
	}: { trades: Trade[]; onDelete: (tradeId: number) => void } = $props();

	const table = createTable(readable(trades), {
		addSortBy: addSortBy({
			initialSortKeys: [{ id: 'createdAt', order: 'desc' }],
		}),
	});

	const columns = table.createColumns([
		table.column({
			accessor: 'id',
			header: 'ID',
		}),
		table.column({
			accessor: 'symbol',
			header: 'Symbol',
		}),
		table.column({
			accessor: 'tradeType',
			header: 'Type',
			cell: ({ value }) => createRender(TradeTypeCell, { tradeType: value }),
			plugins: {
				addSortBy: {
					disable: true,
				},
			},
		}),
		table.column({
			accessor: 'price',
			header: 'Open price',
			cell: ({ value }) => formatIntToCurrency(value),
			plugins: {
				addSortBy: {
					disable: true,
				},
			},
		}),
		table.column({
			accessor: 'quantity',
			header: 'Quantity',
			plugins: {
				addSortBy: {
					disable: true,
				},
			},
		}),
		table.column({
			accessor: 'takeProfit',
			header: 'Take profit',
			cell: ({ value }) => (value ? formatIntToCurrency(value) : '-'),
			plugins: {
				addSortBy: {
					disable: true,
				},
			},
		}),
		table.column({
			accessor: 'stopLoss',
			header: 'Stop loss',
			cell: ({ value }) => (value ? formatIntToCurrency(value) : '-'),
			plugins: {
				addSortBy: {
					disable: true,
				},
			},
		}),
		table.column({
			accessor: 'openedAt',
			header: 'Opened at',
			cell: ({ value }) => (value ? formatISOToDateTimeStr(value) : '-'),
		}),
		table.column({
			accessor: 'createdAt',
			header: 'Created at',
			cell: ({ value }) => (value ? formatISOToDateTimeStr(value) : '-'),
		}),
		table.column({
			accessor: 'comment',
			header: 'Comment',
			plugins: {
				addSortBy: {
					disable: true,
				},
			},
		}),
		table.column({
			accessor: ({ id }) => id,
			header: '',
			cell: ({ value }) => {
				return createRender(DataTableActions, {
					id: value.toString(),
					onEdit: () => {},
					onDelete: onDelete,
				});
			},
			plugins: {
				addSortBy: {
					disable: true,
				},
			},
		}),
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
		table.createViewModel(columns);
</script>

<h2 class="text-xl mt-8">Trades history</h2>

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
								{#if !props.addSortBy.disabled}
									<Button variant="ghost" on:click={props.addSortBy.toggle}>
										<Render of={cell.render()} />
										<ArrowUpDown class={'ml-2 h-4 w-4'} />
									</Button>
								{:else}
									<Render of={cell.render()} />
								{/if}
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
								{#if cell.id === 'tradeType'}
									<span class="capitalize">
										<Render of={cell.render()} />
									</span>
								{:else if !cell.column.plugins?.addSortBy?.disable}
									<div class="pl-4">
										<Render of={cell.render()} />
									</div>
								{:else}
									<Render of={cell.render()} />
								{/if}
							</Table.Cell>
						</Subscribe>
					{/each}
				</Table.Row>
			</Subscribe>
		{/each}
	</Table.Body>
</Table.Root>
