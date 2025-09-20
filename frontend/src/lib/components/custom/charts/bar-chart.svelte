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
		showLegend = true,
		financialMode = true,
		chartType = 'bar',
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
				type: chartType === 'horizontalBar' ? 'bar' : 'bar',
				data,
				options: {
					...getFinancialOptions(),
					indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
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
			if (chartType === 'horizontalBar') {
				(options as any).scales = {
					...options.scales,
					x: {
						...options.scales.y,
						ticks: {
							...options.scales.y.ticks,
							callback: (value: any) => {
								return financialMode ? `$${value}` : value;
							},
						},
					},
					y: {
						...options.scales.x,
						ticks: {
							...options.scales.x.ticks,
						},
					},
				};
				(options as any).indexAxis = 'y';
			} else {
				(options as any).indexAxis = 'x';
			}
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

<div class="w-full h-full">
	<canvas bind:this={canvas}></canvas>
</div>
