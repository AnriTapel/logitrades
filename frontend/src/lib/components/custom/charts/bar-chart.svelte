<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { BarChartData, Trade } from '$lib/types';
	import { formatIntToCurrency } from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { chartGridColor, chartTheme, cssHslVar, cssHslVarAlpha } from '$lib/chart-theme';

	// Register all Chart.js components
	Chart.register(...registerables);

	interface Props {
		data: BarChartData;
		title?: string;
		height?: number;
		showLegend?: boolean;
		financialMode?: boolean;
		chartType?: 'bar' | 'horizontalBar';
		currency?: string;
	}

	let {
		data,
		title = '',
		height = 300,
		showLegend = true,
		financialMode = true,
		currency,
	}: Props = $props();

	const effectiveCurrency = $derived(currency ?? $localeStore.currency);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Default financial styling (currency used in tooltips and Y-axis)
	const getFinancialOptions = (curr: string) => ({
		responsive: true,
		maintainAspectRatio: false,
		indexAsix: 'x',
		plugins: {
			title: {
				display: !!title,
				text: title,
				font: {
					size: 16,
					weight: 'bold' as const,
				},
				color: cssHslVar('--foreground', chartTheme.foreground),
			},
			legend: {
				display: showLegend,
				position: 'top' as const,
			},
			tooltip: {
				backgroundColor: cssHslVarAlpha(
					'--foreground',
					0.92,
					'hsl(204 9.1% 10.8% / 0.92)',
				),
				titleColor: cssHslVar('--primary-foreground', chartTheme.primaryForeground),
				bodyColor: cssHslVar('--primary-foreground', chartTheme.primaryForeground),
				borderColor: cssHslVar('--border', chartTheme.border),
				borderWidth: 1,
				callbacks: {
					label: (context: any) => {
						const value = context.parsed.y || context.parsed.x;
						return `${context.dataset.label}: ${financialMode ? formatIntToCurrency(value, curr) : value}`;
					},
				},
			},
		},
		scales: {
			x: {
				display: true,
				grid: {
					color: chartGridColor(),
				},
				ticks: {
					color: cssHslVar('--muted-foreground', chartTheme.mutedForeground),
				},
			},
			y: {
				display: true,
				grid: {
					color: chartGridColor(),
				},
				ticks: {
					color: cssHslVar('--muted-foreground', chartTheme.mutedForeground),
					callback: (value: any) => {
						return financialMode
							? formatIntToCurrency(Number(value), curr)
							: value;
					},
				},
			},
		},
		animation: {
			duration: 750,
			easing: 'easeInOutQuart' as const,
		},
	});

	onMount(() => {
		if (canvas && data) {
			chart = new Chart(canvas, {
				type: 'bar',
				data: {
					...data,
					datasets: data.datasets.map((dataset) => ({
						...dataset,
						borderWidth: 0,
						borderRadius: 4,
						borderSkipped: false,
					})),
				},
				options: {
					...getFinancialOptions(effectiveCurrency),
				},
			});
		}
	});

	// Update chart when data changes
	$effect(() => {
		if (chart && data) {
			chart.data = {
				...data,
				datasets: data.datasets.map((dataset) => ({
					...dataset,
					borderWidth: 0,
					borderRadius: 4,
					borderSkipped: false,
				})),
			};
			chart.update('none');
		}
	});

	// Update chart options when props (e.g. currency) change
	$effect(() => {
		if (chart) {
			const options = getFinancialOptions(effectiveCurrency);
			chart.options = options;
			chart.update('none');
		}
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<div class="w-full h-full" style="height: {height}px;">
	<canvas bind:this={canvas}></canvas>
</div>
