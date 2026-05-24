<script lang="ts">
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger,
	} from "$lib/components/ui/accordion";
	import { desktopFaqs, faqs } from "$lib/landing/data";
</script>

<section id="faq" class="mx-auto w-full max-w-[1280px] px-6 pt-6 lg:py-24">
	<div class="mx-auto max-w-[390px] lg:hidden">
		<h2 class="text-[30px] font-extrabold text-primary">FAQ</h2>
		<Accordion type="single" class="mt-6 space-y-2">
			{#each faqs as faq}
				<AccordionItem class="rounded-2xl border border-border/30 bg-muted px-5">
					<AccordionTrigger class="text-sm font-semibold text-primary">{faq.question}</AccordionTrigger>
					<AccordionContent>{faq.answer}</AccordionContent>
				</AccordionItem>
			{/each}
		</Accordion>
	</div>

	<div class="mx-auto hidden max-w-[896px] lg:block">
		<h2 class="text-center text-[30px] font-bold text-foreground">Frequently Asked Questions</h2>
		<div class="mt-12 space-y-4">
			{#each desktopFaqs as faq}
				<div class="rounded-xl border border-border/10 bg-card px-6 py-6">
					<h3 class="text-base font-bold text-foreground">{faq.question}</h3>
					<p class="mt-2 text-sm leading-[22.75px] text-muted-foreground">{faq.answer}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
