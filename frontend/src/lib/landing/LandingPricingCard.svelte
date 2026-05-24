<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import Check from "lucide-svelte/icons/check";
	import { cn } from "$lib/utils";

	let {
		name,
		price,
		cadence,
		description,
		features,
		cta,
		featured = false,
		desktop = false,
	}: {
		name: string;
		price: string;
		cadence: string;
		description: string;
		features: readonly string[];
		cta: string;
		featured?: boolean;
		desktop?: boolean;
	} = $props();
</script>

<div class={cn(desktop && featured ? "scale-105" : "")}>
	<Card
		class={cn(
			"relative py-0",
			desktop ? "rounded-2xl" : "rounded-3xl",
			featured
				? "border-none bg-primary text-primary-foreground shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
				: "border-border/10 bg-muted",
		)}
	>
		{#if featured}
			<Badge
				class={cn(
					"absolute right-0 top-0 border border-primary-foreground/25 bg-primary-foreground/15 px-4 py-1 text-[10px] uppercase tracking-wide text-primary-foreground/90",
					desktop ? "rounded-bl-lg rounded-tr-2xl" : "rounded-bl-2xl rounded-tr-3xl",
				)}
			>
				{desktop ? "Popular" : "Most Popular"}
			</Badge>
		{/if}
		<CardContent class={cn("space-y-5", desktop ? "p-10" : "p-8")}>
			<p class={cn("text-[10px] font-semibold uppercase tracking-[1px]", featured ? "text-primary-foreground/75" : "text-muted-foreground")}>
				{name}
			</p>
			<div class="flex items-end gap-1">
				<p class={cn("text-3xl font-bold", featured ? "text-primary-foreground" : "text-primary")}>{price}</p>
				<p class={cn("pb-1 text-sm", featured ? "text-primary-foreground/70" : "text-muted-foreground")}>{cadence}</p>
			</div>
			<p class={cn("text-sm", featured ? "text-primary-foreground/80" : "text-muted-foreground")}>{description}</p>
			<ul class="space-y-3">
				{#each features as feature}
					<li class="flex items-center gap-3 text-sm">
						<Check class={cn("h-4 w-4", featured ? "text-primary-foreground/80" : "text-primary")} />
						<span>{feature}</span>
					</li>
				{/each}
			</ul>
			<Button
				class={cn(
					"mt-2 w-full",
					featured
						? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
						: desktop
							? "rounded border border-border bg-transparent text-foreground hover:bg-transparent"
							: "rounded-xl bg-secondary text-primary hover:bg-secondary/80",
				)}
			>
				{cta}
			</Button>
		</CardContent>
	</Card>
</div>
