<script lang="ts">
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import Clock3 from 'lucide-svelte/icons/clock-3';
	import LandingNav from '$lib/landing/LandingNav.svelte';
	import LandingHero from '$lib/landing/LandingHero.svelte';
	import LandingSocialProof from '$lib/landing/LandingSocialProof.svelte';
	import LandingFeatureCard from '$lib/landing/LandingFeatureCard.svelte';
	import LandingFeatureBento from '$lib/landing/LandingFeatureBento.svelte';
	import LandingSteps from '$lib/landing/LandingSteps.svelte';
	import LandingCanvasSection from '$lib/landing/LandingCanvasSection.svelte';
	import LandingPricingCard from '$lib/landing/LandingPricingCard.svelte';
	import LandingFaq from '$lib/landing/LandingFaq.svelte';
	import LandingFooter from '$lib/landing/LandingFooter.svelte';
	import LandingFinalCta from '$lib/landing/LandingFinalCta.svelte';
	import {
		desktopPricingPlans,
		featureItems,
		pricingPlans,
	} from '$lib/landing/data';

	let { data }: { data: { isAuthenticated?: boolean } } = $props();

	const featureIcons = [BarChart3, ShieldCheck, Clock3];
</script>

<svelte:head>
	<title>LogiTrades - Institutional Trading Journal for Retail Traders</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<LandingNav isAuthenticated={data.isAuthenticated} />
	<LandingHero />
	<LandingSocialProof />

	<LandingFeatureBento />

	<section class="mx-auto mt-8 w-full max-w-[420px] px-6 lg:hidden">
		<p
			class="text-center text-xs font-semibold uppercase tracking-[1.2px] text-muted-foreground"
		>
			Why LogiTrades
		</p>
		<h2 class="mt-2 text-center text-[30px] font-extrabold text-primary">
			Everything serious traders need.
		</h2>

		<div class="mt-6 rounded-2xl border border-border bg-muted p-4 space-y-4">
			{#each featureItems as feature, i}
				<LandingFeatureCard
					title={feature.title}
					description={feature.description}
					icon={featureIcons[i]}
					tileClass={feature.tileClass}
				/>
			{/each}
		</div>
	</section>

	<LandingSteps />
	<LandingCanvasSection />

	<section
		id="pricing"
		class="mx-auto w-full max-w-[1280px] px-6 pt-6 lg:bg-muted lg:py-24"
	>
		<div class="mx-auto max-w-[390px] lg:hidden">
			<p
				class="text-center text-xs font-semibold uppercase tracking-[1.2px] text-muted-foreground"
			>
				Flexible Plans
			</p>
			<h2 class="mt-2 text-center text-[30px] font-extrabold text-primary">
				Built for your growth.
			</h2>
		</div>
		<div class="mx-auto hidden lg:block">
			<h2
				class="text-center text-4xl font-bold tracking-[-0.9px] text-foreground"
			>
				The Right Plan for Your Journey
			</h2>
			<p class="mt-4 text-center text-base text-muted-foreground">
				Scalable analytics for every stage of your career.
			</p>
		</div>

		<div class="mt-8 space-y-6 lg:hidden">
			{#each pricingPlans as plan}
				<LandingPricingCard
					name={plan.name}
					price={plan.price}
					cadence={plan.cadence}
					description={plan.description}
					features={plan.features}
					cta={plan.cta}
					featured={plan.featured}
				/>
			{/each}
		</div>

		<div class="mt-16 hidden grid-cols-3 gap-8 lg:grid">
			{#each desktopPricingPlans as plan}
				<LandingPricingCard
					name={plan.name}
					price={plan.price}
					cadence={plan.cadence}
					description={plan.description}
					features={plan.features}
					cta={plan.cta}
					featured={plan.featured}
					desktop={true}
				/>
			{/each}
		</div>
	</section>

	<LandingFaq />
	<LandingFinalCta />
	<LandingFooter />
</div>
