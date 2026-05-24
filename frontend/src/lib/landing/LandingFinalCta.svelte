<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { finalCta } from "$lib/landing/data";
</script>

<section id="security" class="mx-auto hidden w-full max-w-[1280px] px-6 py-12 lg:block lg:py-16">
	<div
		class="rounded-[32px] bg-primary px-6 py-16 text-center lg:rounded-[32px] lg:px-20 lg:py-24"
	>
		<h2 class="mx-auto max-w-[540px] text-4xl font-extrabold leading-[48px] text-primary-foreground">
			{finalCta.title}
		</h2>
		<p class="mx-auto mt-8 max-w-[640px] text-lg text-primary-foreground/80 lg:text-[20px]">
			{finalCta.description}
		</p>
		<Button
			href="/signup"
			class="mt-10 h-14 rounded-lg bg-primary-foreground px-10 text-lg font-semibold text-primary hover:bg-primary-foreground/90"
		>
			{finalCta.button}
		</Button>
		<p class="mt-6 text-sm text-primary-foreground/60">{finalCta.disclaimer}</p>
	</div>
</section>
