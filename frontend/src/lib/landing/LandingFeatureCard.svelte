<script lang="ts">
	import { Card, CardContent } from "$lib/components/ui/card";
	import { cn } from "$lib/utils";

	let {
		title,
		description,
		icon,
		tileClass,
	}: {
		title: string;
		description: string;
		icon: any;
		tileClass: string;
	} = $props();
	let Icon = $derived(icon);
</script>

<Card class="rounded-3xl border-border/10 py-0">
	<CardContent class="space-y-6 p-8">
		<div class={cn("flex h-12 w-12 items-center justify-center rounded-2xl", tileClass)}>
			<Icon class="h-5 w-5 text-primary" />
		</div>
		<div class="space-y-3">
			<h3 class="text-xl font-bold text-primary">{title}</h3>
			<p class="text-base leading-6 text-muted-foreground">{description}</p>
		</div>
	</CardContent>
</Card>
