<script lang="ts">
	import type { CalendarHeatmapItemData, Trade } from '$lib/types';
	import {
		getDaysMatrix,
		getHeatmapDataMapPerDate,
		getHeatmapMonthsOptions,
		getWeekdayLabels,
	} from '$lib/components/custom/charts/calendar-heatmap/utils';
	import {
		Root as SelectRoot,
		SelectTrigger,
		SelectItem,
		SelectContent,
	} from '$lib/components/ui/select';
	import { cn, getFinancialColor } from '$lib/utils';
	import { formatIntToCurrency } from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';

	type Props = {
		monthsToShow?: number;
		trades: Trade[];
	};

	let { trades, monthsToShow = 12 }: Props = $props();

	const availableMonthsOptions = $derived(
		getHeatmapMonthsOptions(monthsToShow),
	);
	let selectedMonthKey = $state<string | undefined>(undefined);

	const resolvedMonthKey = $derived(
		selectedMonthKey ?? availableMonthsOptions.at(-1)?.key,
	);

	const currentMonth = $derived(
		availableMonthsOptions.find((option) => option.key === resolvedMonthKey),
	);

	const weekdayLabels = $derived(getWeekdayLabels());

	const daysMatrix = $derived.by(() => {
		if (!resolvedMonthKey) {
			return [];
		}

		return getDaysMatrix(
			resolvedMonthKey,
			getHeatmapDataMapPerDate(trades, resolvedMonthKey),
		);
	});

	function onCurrentMonthChange(key: string): void {
		selectedMonthKey = key;
	}

	function dayOfMonth(date: string): number {
		return new Date(date).getDate();
	}

	function cellClasses(cell: CalendarHeatmapItemData): string {
		if (!cell) {
			return 'bg-muted/50';
		}

		if (cell.tradesCount === 0 || cell.pnl === 0) {
			return 'bg-background border-border/70';
		}

		if (cell.pnl > 0) {
			return 'bg-green-100/80 border-green-200/80';
		}

		return 'bg-red-100/80 border-red-200/80';
	}
</script>

<div class="flex w-full max-w-xl flex-col gap-2">
	<div class="flex items-center gap-2">
		<p class="text-sm text-muted-foreground">Target month</p>

		<SelectRoot
			type="single"
			value={resolvedMonthKey}
			onValueChange={onCurrentMonthChange}
		>
			<SelectTrigger
				class="w-48 border-border bg-background px-2 py-1.5 text-sm shadow-none"
				placeholder="Select a month"
			>
				<span>{currentMonth?.label ?? 'Select a month'}</span>
			</SelectTrigger>
			<SelectContent>
				{#each availableMonthsOptions as month (month.key)}
					<SelectItem value={month.key}>
						{month.label}
					</SelectItem>
				{/each}
			</SelectContent>
		</SelectRoot>
	</div>

	<div class="rounded-lg border border-border bg-card p-3 shadow-sm">
		<div class="mb-1 grid grid-cols-7 gap-1">
			{#each weekdayLabels as weekday (weekday)}
				<div
					class="px-0.5 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs"
				>
					{weekday.slice(0, 2)}
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-7 gap-1">
			{#each daysMatrix as week, weekIndex (weekIndex)}
				{#each week as cell, dayIndex (`${weekIndex}-${dayIndex}`)}
					<div
						class={cn(
							'flex aspect-square min-h-11 flex-col items-center justify-center rounded-md border px-0.5 py-1 text-center sm:min-h-12',
							cellClasses(cell),
						)}
					>
						{#if cell}
							<span
								class="text-[11px] font-semibold leading-none text-foreground sm:text-xs"
							>
								{dayOfMonth(cell.date)}
							</span>

							{#if cell.tradesCount > 0}
								<span
									class={cn(
										'mt-0.5 text-[9px] font-medium leading-tight sm:text-[10px]',
										getFinancialColor(cell.pnl, 0),
									)}
								>
									{formatIntToCurrency(cell.pnl, $localeStore.currency)}
								</span>
								<span
									class="text-[9px] leading-tight text-muted-foreground sm:text-[10px]"
								>
									{cell.tradesCount}
									{cell.tradesCount === 1 ? 'trade' : 'trades'}
								</span>
							{/if}
						{/if}
					</div>
				{/each}
			{/each}
		</div>
	</div>
</div>
