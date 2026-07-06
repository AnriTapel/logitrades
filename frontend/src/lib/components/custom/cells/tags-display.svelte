<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { tags }: { tags?: string[] } = $props();
</script>

{#if tags?.length}
	<div class="flex flex-col gap-1 items-start w-[120px]">
		{#each tags as tag (tag)}
			<Badge variant="outline">{tag}</Badge>
		{/each}
	</div>
{:else}
	<span class="text-sm font-medium">-</span>
{/if}
