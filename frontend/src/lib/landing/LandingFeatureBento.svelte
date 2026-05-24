<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import ChartNoAxesColumn from 'lucide-svelte/icons/chart-no-axes-column';
	import Zap from 'lucide-svelte/icons/zap';
	import Clock3 from 'lucide-svelte/icons/clock-3';
	import CloudDownload from 'lucide-svelte/icons/cloud-download';
	import { desktopBentoFeatures } from '$lib/landing/data';
</script>

<section id="features" class="mx-auto w-full max-w-[1280px] px-6 py-24">
	<p
		class="text-xs font-semibold uppercase tracking-[1.2px] lg:text-primary text-foreground"
	>
		{desktopBentoFeatures.eyebrow}
	</p>
	<h2
		class="mt-2 text-4xl font-bold tracking-[-0.9px] lg:text-foreground text-primary"
	>
		{desktopBentoFeatures.title}
	</h2>

	<div
		class="mt-12 lg:mt-16 flex flex-col items-center gap-4 lg:grid lg:grid-cols-5 lg:gap-6"
	>
		<Card
			class="col-span-3 h-full rounded-2xl py-0 max-w-[380px] lg:max-w-none"
		>
			<CardContent class="flex h-full flex-col space-y-8 p-8">
				<div class="space-y-5">
					<div class="flex items-center gap-2">
						<ChartNoAxesColumn class="h-6 w-6 text-primary" />
						<h3 class="text-2xl lg:text-3xl font-bold text-foreground">
							{desktopBentoFeatures.tradeLogging.title}
						</h3>
					</div>
					<p
						class="max-w-[620px] text-sm lg:text-base leading-[26px] text-muted-foreground"
					>
						{desktopBentoFeatures.tradeLogging.description}
					</p>
				</div>
				<div
					class="min-h-0 flex-1 hidden overflow-hidden rounded-lg border border-border/20 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] lg:block"
				>
					<img
						src="/landing/create_trade_1376x768.png"
						alt="Trade data entry modal in LogiTrades"
						class="h-auto w-full"
						loading="lazy"
						width="1024"
						height="800"
					/>
				</div>
			</CardContent>
		</Card>

		<div class="col-span-2 flex h-full min-h-0 flex-col gap-6">
			<Card
				class="min-h-0 flex-1 rounded-2xl border-none bg-primary py-0 shadow-[0_12px_32px_rgba(25,28,30,0.08)] max-w-[380px] lg:max-w-none"
			>
				<CardContent class="flex h-full flex-col justify-center space-y-6 p-8">
					<div class="flex items-center gap-2">
						<Zap class="h-6 w-6 text-primary-foreground/75" />
						<h3 class="text-2xl lg:text-3xl font-bold text-primary-foreground">
							{desktopBentoFeatures.performanceAnalytics.title}
						</h3>
					</div>
					<p
						class="text-sm lg:text-base leading-[26px] text-primary-foreground/75"
					>
						{desktopBentoFeatures.performanceAnalytics.description}
					</p>
				</CardContent>
			</Card>

			<Card class="min-h-0 flex-1 rounded-2xl py-0 max-w-[380px] lg:max-w-none">
				<CardContent class="flex h-full flex-col justify-center space-y-6 p-8">
					<div class="flex items-center gap-2">
						<Clock3 class="h-6 w-6 text-primary" />
						<h3 class="text-2xl lg:text-3xl font-bold text-foreground">
							{desktopBentoFeatures.disciplineTracker.title}
						</h3>
					</div>
					<p class="text-sm lg:text-base leading-[26px] text-muted-foreground">
						{desktopBentoFeatures.disciplineTracker.description}
					</p>
				</CardContent>
			</Card>

			<Card
				class="min-h-0 flex-1 rounded-2xl bg-muted py-0 max-w-[380px] lg:max-w-none"
			>
				<CardContent class="flex h-full flex-col justify-between gap-6 p-8">
					<div class="space-y-6">
						<div class="flex items-center gap-2">
							<CloudDownload class="h-6 w-6 text-primary" />
							<h3 class="text-2xl lg:text-3xl font-bold text-foreground">
								{desktopBentoFeatures.dataExport.title}
							</h3>
						</div>
						<p
							class="text-sm lg:text-base leading-[26px] text-muted-foreground"
						>
							{desktopBentoFeatures.dataExport.description}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</section>
