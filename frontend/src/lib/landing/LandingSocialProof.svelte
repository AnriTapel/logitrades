<script lang="ts">
	import { keyBenefits } from '$lib/landing/data';
</script>

<section
	class="mt-10 w-full bg-muted py-8 lg:border-y lg:border-border/10 lg:py-10"
>
	<div class="mx-auto w-full max-w-[1280px] px-6">
		<p
			class="text-center text-xs uppercase tracking-[2.4px] text-muted-foreground"
		>
			{keyBenefits.eyebrow}
		</p>
		<div
			class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 opacity-50 sm:gap-x-8 lg:mt-8 lg:gap-x-12 lg:gap-y-4"
		>
			{#each keyBenefits.items as benefit}
				<span class="text-sm font-medium tracking-wide text-muted-foreground"
					>{benefit}</span
				>
			{/each}
		</div>
	</div>
</section>
