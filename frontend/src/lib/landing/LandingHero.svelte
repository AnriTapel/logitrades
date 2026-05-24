<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { heroContent } from '$lib/landing/data';
</script>

<section class="mx-auto w-full max-w-[1280px] px-6 pt-24 lg:pt-32">
	<div class="flex flex-col gap-6 lg:hidden">
		<div
			class="w-fit rounded-full bg-[#e6e9ed] px-3 py-1 text-[12px] font-semibold uppercase tracking-[1.2px] text-muted-foreground"
		>
			{heroContent.mobile.badge}
		</div>

		<div class="space-y-4">
			<h1
				class="text-[36px] font-extrabold leading-[1.25] tracking-[-0.9px] text-primary"
			>
				{heroContent.mobile.title}
			</h1>
			<p class="text-[18px] leading-[1.6] text-muted-foreground">
				{heroContent.mobile.description}
			</p>
		</div>

		<div class="flex flex-col gap-3 pt-4">
			<Button
				href="/signup"
				class="h-12 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
			>
				{heroContent.mobile.primaryCta}
			</Button>
			<Button
				href="/login"
				variant="secondary"
				class="h-12 w-full rounded-2xl border border-border bg-[#e1e2e6] text-base font-bold"
			>
				{heroContent.mobile.secondaryCta}
			</Button>
		</div>

		<div class="pt-8">
			<div
				class="overflow-hidden rounded-2xl border border-border/20 bg-card shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
			>
				<img
					src="/landing/hero_section_dashboard_1376x768.png"
					alt="LogiTrades trading dashboard preview on mobile"
					class="h-auto w-full"
					loading="lazy"
				/>
			</div>
		</div>
	</div>

	<div class="hidden items-center gap-16 lg:grid lg:grid-cols-12">
		<div class="col-span-6 space-y-8">
			<div
				class="w-fit rounded bg-[#d7e3f7] px-3 py-1 text-[12px] font-bold uppercase tracking-[1.2px] text-foreground"
			>
				{heroContent.desktop.badge}
			</div>
			<div class="space-y-5">
				<h1
					class="text-[60px] font-extrabold leading-[60px] tracking-[-1.5px] text-foreground"
				>
					<span class="block">{heroContent.desktop.titleStart}</span>
					<span class="block">
						the <span class="text-primary"
							>{heroContent.desktop.titleHighlight}</span
						>
					</span>
					<span class="block">{heroContent.desktop.titleEnd}</span>
				</h1>
				<p
					class="max-w-[576px] text-[20px] leading-[32px] text-muted-foreground"
				>
					{heroContent.desktop.description}
				</p>
			</div>
			<div class="flex items-center gap-4 pt-4">
				<Button
					href="/signup"
					class="h-14 rounded-lg px-8 text-base font-semibold shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
				>
					{heroContent.desktop.primaryCta}
					<ArrowRight class="h-4 w-4" />
				</Button>
				<Button
					href="/login"
					variant="secondary"
					class="h-14 rounded-lg px-8 text-base font-semibold"
				>
					{heroContent.desktop.secondaryCta}
				</Button>
			</div>
		</div>
		<div class="col-span-6">
			<div
				class="overflow-hidden rounded-2xl border border-border/20 bg-card p-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
			>
				<img
					src="/landing/hero_section_dashboard_1376x768.png"
					alt="LogiTrades desktop dashboard preview"
					class="h-auto w-full rounded-lg"
					loading="lazy"
				/>
			</div>
		</div>
	</div>
</section>
