<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { Trade, PieChartData } from '$lib/types';
	import { getColorPalette } from '$lib/chartsHelpers';

	// Register all Chart.js components
	Chart.register(...registerables);

	interface Props {
		data: PieChartData;
		title?: string;
		height?: number;
		showLegend?: boolean;
		financialMode?: boolean;
		chartType?: 'pie' | 'doughnut';
	}

	let {
		data,
		title = '',
		height = 300,
		showLegend = true,
		financialMode = true,
		chartType = 'pie',
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Default financial styling
	const getFinancialOptions = () => ({
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
				position: 'right' as const,
				labels: {
					usePointStyle: true,
					padding: 20,
					color: '#374151',
					font: {
						size: 12,
					},
				},
			},
			tooltip: {
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				titleColor: '#fff',
				bodyColor: '#fff',
				borderColor: '#374151',
				borderWidth: 1,
				callbacks: {
					label: (context: any) => {
						const label = context.label || '';
						const value = context.parsed;
						const total = context.dataset.data.reduce(
							(a: number, b: number) => a + b,
							0
						);
						const percentage = ((value / total) * 100).toFixed(1);

						if (financialMode) {
							return `${label}: $${value.toFixed(2)} (${percentage}%)`;
						}
						return `${label}: ${value} (${percentage}%)`;
					},
				},
			},
		},
		animation: {
			animateRotate: true,
			animateScale: true,
			duration: 750,
		},
		cutout: chartType === 'doughnut' ? '50%' : 0,
	});

	onMount(() => {
		if (canvas && data) {
			chart = new Chart(canvas, {
				type: chartType,
				data: {
					...data,
					datasets: data.datasets.map((dataset) => ({
						...dataset,
						backgroundColor:
							dataset.backgroundColor || getColorPalette(dataset.data.length),
						borderColor: 'transparent',
						borderWidth: 0,
					})),
				},
				options: getFinancialOptions(),
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
					backgroundColor:
						dataset.backgroundColor || getColorPalette(dataset.data.length),
					borderColor: 'transparent',
					borderWidth: 0,
				})),
			};
			chart.update('none');
		}
	});

	// Update chart type when prop changes
	$effect(() => {
		if (chart) {
			const options = getFinancialOptions();
			options.cutout = chartType === 'doughnut' ? '50%' : 0;
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

<div class="w-full" style="height: {height}px;">
	<canvas bind:this={canvas}></canvas>
</div>
