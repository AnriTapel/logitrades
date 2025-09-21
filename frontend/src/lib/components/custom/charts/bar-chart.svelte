<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { BarChartData, Trade } from '$lib/types';

	// Register all Chart.js components
	Chart.register(...registerables);

	interface Props {
		data: BarChartData;
		title?: string;
		height?: number;
		showLegend?: boolean;
		financialMode?: boolean;
		chartType?: 'bar' | 'horizontalBar';
	}

	let {
		data,
		title = '',
		height = 300,
		showLegend = true,
		financialMode = true,
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Default financial styling
	const getFinancialOptions = () => ({
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
				color: '#374151',
			},
			legend: {
				display: showLegend,
				position: 'top' as const,
			},
			tooltip: {
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				titleColor: '#fff',
				bodyColor: '#fff',
				borderColor: '#374151',
				borderWidth: 1,
				callbacks: {
					label: (context: any) => {
						const value = context.parsed.y || context.parsed.x;
						return `${context.dataset.label}: ${financialMode ? `$${value.toFixed(2)}` : value}`;
					},
				},
			},
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
						return financialMode ? `$${value}` : value;
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
				data,
				options: {
					...getFinancialOptions(),
				},
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

	// Update chart type when prop changes
	$effect(() => {
		if (chart) {
			const options = getFinancialOptions();
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
