<script lang="ts">
	let { comment }: { comment?: string } = $props();
</script>

<div class="w-[200px] truncate">
	<span class="text-sm font-medium" title={comment}>{comment ?? '-'}</span>
</div>
