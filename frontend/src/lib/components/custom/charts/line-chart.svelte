<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { Trade, LineChartData } from '$lib/types';
	import { formatIntToCurrency } from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';

	interface Props {
		data: LineChartData;
		title?: string;
		height?: number;
		showLegend?: boolean;
		financialMode?: boolean; // Enable financial-specific styling
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
		plugins: {
			title: {
				display: !!title,
				text: title,
				font: {
					size: 16,
					weight: 'bold' as const,
				},
				color: '#374151',
			},
			legend: {
				display: showLegend,
				position: 'top' as const,
			},
			tooltip: {
				mode: 'index' as const,
				intersect: false,
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				titleColor: '#fff',
				bodyColor: '#fff',
				borderColor: '#374151',
				borderWidth: 1,
				callbacks: {
					label: (context: any) => {
						const value = context.parsed.y;
						return `${context.dataset.label}: ${financialMode ? formatIntToCurrency(value, curr) : value}`;
					},
				},
			},
		},
		interaction: {
			mode: 'nearest' as const,
			axis: 'x' as const,
			intersect: false,
		},
		scales: {
			x: {
				display: true,
				grid: {
					color: 'rgba(0, 0, 0, 0.1)',
				},
				ticks: {
					color: '#6b7280',
				},
			},
			y: {
				display: true,
				grid: {
					color: 'rgba(0, 0, 0, 0.1)',
				},
				ticks: {
					color: '#6b7280',
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
		Chart.register(...registerables);

		if (canvas && data) {
			chart = new Chart(canvas, {
				type: 'line',
				data: $state.snapshot(data),
				options: getFinancialOptions(effectiveCurrency),
			});
		}
	});

	// Update chart when data changes
	$effect(() => {
		if (chart && data) {
			chart.data = data;
			chart.update('none');
		}
	});

	// Update chart options when props (e.g. currency) change
	$effect(() => {
		if (chart) {
			chart.options = getFinancialOptions(effectiveCurrency);
			chart.update('none');
		}
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<div class="w-full" style="height: {height}px;">
	<canvas bind:this={canvas}></canvas>
</div>
