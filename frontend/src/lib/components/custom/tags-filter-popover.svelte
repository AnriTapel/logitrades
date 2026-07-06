<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import Tag from 'lucide-svelte/icons/tag';
	import { cn } from '$lib/utils';

	let {
		availableTags,
		selectedTags = $bindable([]),
		onSelectedTagsChange,
		disabled = false,
	}: {
		availableTags: string[];
		selectedTags?: string[];
		onSelectedTagsChange?: (tags: string[]) => void;
		disabled?: boolean;
	} = $props();

	let open = $state(false);

	const isTagSelected = (tag: string): boolean => selectedTags.includes(tag);

	const toggleTag = (tag: string): void => {
		const next = isTagSelected(tag)
			? selectedTags.filter((t) => t !== tag)
			: [...selectedTags, tag];
		selectedTags = next;
		onSelectedTagsChange?.(next);
	};
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				size="icon"
				class={cn('relative h-9 w-9 shrink-0', disabled && 'opacity-50')}
				{disabled}
				aria-label="Filter by tags"
			>
				<Tag class="size-4" />
				{#if selectedTags.length > 0}
					<Badge
						variant="default"
						class="absolute -right-1 -top-1 size-4 justify-center p-0 text-[10px]"
					>
						{selectedTags.length}
					</Badge>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-56 p-3" align="start">
		<p class="mb-2 text-sm font-medium">Filter by tags</p>
		{#if availableTags.length === 0}
			<p class="text-sm text-muted-foreground">No tags yet</p>
		{:else}
			<div class="max-h-48 space-y-2 overflow-y-auto">
				{#each availableTags as tag (tag)}
					<div class="flex items-center gap-2">
						<Checkbox
							id="tag-filter-{tag}"
							checked={isTagSelected(tag)}
							onCheckedChange={() => toggleTag(tag)}
						/>
						<Label for="tag-filter-{tag}" class="cursor-pointer text-sm font-normal">
							{tag}
						</Label>
					</div>
				{/each}
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
