import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import type { Trade, TradeType } from '$lib/types';
import { formatIntToCurrency, formatNumber } from '$lib/formatters';
import { calcAbsolutePnl } from '$lib/calcFunctions';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import StatusBadge from '$lib/components/custom/status-badge.svelte';
import TradeTypeCell from '$lib/components/custom/cells/trade-type-cell.svelte';
import TpSLDisplay from '$lib/components/custom/cells/tpsl-display.svelte';
import TradeDatesDisplay from '$lib/components/custom/cells/trade-dates-display.svelte';
import PnLDisplay from '$lib/components/custom/cells/pnl-display.svelte';
import DataTableActions from './trades-table-actions.svelte';

export function createColumns(
	onEdit: (id: number) => void,
	onDelete: (id: number) => void
): ColumnDef<Trade>[] {
	return [
		// Symbol column - sortable, filterable
		{
			accessorKey: 'symbol',
			header: 'Symbol',
			cell: ({ row }) => {
				const symbolSnippet = createRawSnippet<[{ symbol: string }]>((getSymbol) => {
					const { symbol } = getSymbol();
					return {
						render: () => `<span class="font-medium">${symbol}</span>`,
					};
				});
				return renderSnippet(symbolSnippet, {
					symbol: row.original.symbol
				});
			},
			enableSorting: true,
			enableColumnFilter: true,
		},

		// Status column - badge display
		{
			accessorFn: (row) => (row.closePrice ? 'closed' : 'open'),
			id: 'status',
			header: 'Status',
			cell: ({ row }) =>
				renderComponent(StatusBadge, {
					status: row.getValue('status') as 'open' | 'closed',
				}),
			enableSorting: false,
		},

		// Type column - sortable, filterable
		{
			accessorKey: 'tradeType',
			header: 'Type',
			cell: ({ row }) =>
				renderComponent(TradeTypeCell, {
					tradeType: row.getValue<TradeType>('tradeType'),
				}),
			enableSorting: true,
			enableColumnFilter: true,
		},

		// Quantity column
		{
			accessorKey: 'quantity',
			header: 'Quantity',
			cell: ({ row }) => {
				const qtySnippet = createRawSnippet<[{ qty: number }]>((getQty) => {
					const { qty } = getQty();
					return {
						render: () => `<span>${formatNumber(qty, 6)}</span>`,
					};
				});
				return renderSnippet(qtySnippet, {
					qty: row.original.quantity
				  });
			},
			enableSorting: false,
		},

		// Open Price column
		{
			accessorKey: 'openPrice',
			header: 'Open Price',
			cell: ({ row }) => {
				const priceSnippet = createRawSnippet<[{ price: number }]>((getPrice) => {
					const { price } = getPrice();
					return {
						render: () => `<span>${formatIntToCurrency(price, 6)}</span>`,
					};
				});
				return renderSnippet(priceSnippet, {
					price: row.original.openPrice
				});
			},
			enableSorting: false,
		},

		// Leverage column
		{
			accessorKey: 'leverage',
			header: 'Leverage',
			cell: ({ row }) => {
				const leverageSnippet = createRawSnippet<[{ leverage: number | undefined }]>((getLeverage) => {
						const { leverage } = getLeverage();
						return {
							render: () =>
								`<span>${leverage ? `${leverage}x` : '-'}</span>`,
						};
					}
				);
				return renderSnippet(leverageSnippet, {
					leverage: row.original.leverage
				});
			},
			enableSorting: false,
		},

		// TP/SL column
		{
			accessorFn: (row) => ({ takeProfit: row.takeProfit, stopLoss: row.stopLoss }),
			id: 'tpsl',
			header: 'TP/SL',
			cell: ({ row }) => {
				const tpsl = row.getValue('tpsl') as {
					takeProfit?: number;
					stopLoss?: number;
				};
				return renderComponent(TpSLDisplay, {
					takeProfit: tpsl.takeProfit ?? null,
					stopLoss: tpsl.stopLoss ?? null,
				});
			},
			enableSorting: false,
		},

		// Close Price column
		{
			accessorKey: 'closePrice',
			header: 'Close Price',
			cell: ({ row }) => {
				const closePriceSnippet = createRawSnippet<[{ price: number | undefined }]>((getPrice) => {
					const { price } = getPrice();
					return {
						render: () =>
							`<span>${price ? formatIntToCurrency(price, 6) : '-'}</span>`,
					};
				});
				return renderSnippet(closePriceSnippet, {
					price: row.original.closePrice
				});
			},
			enableSorting: false,
		},

		// Trade Dates column - sortable by openedAt
		{
			accessorFn: (row) => new Date(row.openedAt).getTime(),
			id: 'tradeDates',
			header: 'Trade Dates',
			cell: ({ row }) =>
				renderComponent(TradeDatesDisplay, {
					openedAt: row.original.openedAt,
					closedAt: row.original.closedAt,
				}),
			enableSorting: true,
			sortingFn: 'basic',
		},

		// PnL column - sortable by absolute PnL
		{
			accessorFn: (row) => calcAbsolutePnl(row) ?? 0,
			id: 'pnl',
			header: 'PnL',
			cell: ({ row }) =>
				renderComponent(PnLDisplay, {
					trade: row.original,
				}),
			enableSorting: true,
			sortingFn: 'basic',
		},

		// Actions column
		{
			id: 'actions',
			header: '',
			cell: ({ row }) =>
				renderComponent(DataTableActions, {
					id: row.original.id,
					onEdit,
					onDelete,
				}),
			enableSorting: false,
		},
	];
}
