<script lang="ts">
	import ScanSearch from 'lucide-svelte/icons/scan-search';
	import Brain from 'lucide-svelte/icons/brain';
	import Circle from 'lucide-svelte/icons/circle';
	import { deepDive } from '$lib/landing/data';
</script>

<section class="mt-16 w-full">
	<div class="w-full bg-primary pb-20 pt-24 lg:hidden">
		<div class="mx-auto w-full max-w-[390px] px-6">
			<div class="space-y-3 text-center">
				<h2 class="text-[30px] font-bold leading-9 text-primary-foreground">
					The Analytical Canvas
				</h2>
				<p class="text-base text-primary-foreground/75">
					Everything you need, nothing you don&apos;t.
				</p>
			</div>

			<div
				class="mt-8 overflow-hidden rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
			>
				<img
					src="/landing/stats_dashboard_on_screen_1024x1024.png"
					alt="Detailed analytics view from LogiTrades"
					class="h-auto w-full"
					loading="lazy"
					width="768"
					height="768"
				/>
			</div>

			<div class="mt-8 space-y-4">
				<div
					class="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/80 px-4 py-4 text-sm font-semibold text-primary backdrop-blur-[10px]"
				>
					<ScanSearch class="h-5 w-5" />
					Heatmaps & Correlation Analysis
				</div>
				<div
					class="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/80 px-4 py-4 text-sm font-semibold text-primary backdrop-blur-[10px]"
				>
					<Brain class="h-5 w-5" />
					Automated Psychological Tagging
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto hidden w-full max-w-[1280px] px-6 py-24 lg:block">
		<div class="mx-auto max-w-[768px] space-y-6 text-center">
			<h2 class="text-4xl font-bold tracking-[-0.9px] text-foreground">
				{deepDive.title}
			</h2>
			<p class="text-[18px] leading-[29px] text-muted-foreground">
				{deepDive.description}
			</p>
		</div>

		<div
			class="relative isolate mt-20 rounded-3xl border border-border/20 bg-card p-8 shadow-[0_25px_50px_-12px_rgba(25,28,30,0.12)]"
		>
			<div class="relative">
				<img
					src="/landing/stats_dashboard_on_screen_1344x768.png"
					width="1344"
					height="768"
					alt="Detailed desktop journal view"
					class="relative z-0 h-auto w-full rounded-lg"
					loading="lazy"
				/>
				<div
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 z-10 rounded-lg bg-foreground/45 [mask-image:radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,black_100%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,black_100%)]"
				></div>
			</div>
			<div
				class="absolute left-[7%] top-[23%] z-20 rounded-lg border border-primary/25 bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.16),0_16px_40px_rgba(0,0,0,0.14)] backdrop-blur-sm"
			>
				<Circle class="mr-2 inline h-3 w-3 fill-primary text-primary" />
				{deepDive.callouts[0]}
			</div>
			<div
				class="absolute bottom-[20%] left-[39%] z-20 rounded-lg border border-primary/25 bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.16),0_16px_40px_rgba(0,0,0,0.14)] backdrop-blur-sm"
			>
				<Circle
					class="mr-2 inline h-3 w-3 fill-muted-foreground text-muted-foreground"
				/>
				{deepDive.callouts[1]}
			</div>
			<div
				class="absolute right-[7%] top-[42%] z-20 rounded-lg border border-primary/25 bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.16),0_16px_40px_rgba(0,0,0,0.14)] backdrop-blur-sm"
			>
				<Circle
					class="mr-2 inline h-3 w-3 fill-foreground/35 text-foreground/35"
				/>
				{deepDive.callouts[2]}
			</div>
		</div>
	</div>
</section>
