<script lang="ts">
	const { leverage }: { leverage: number | undefined } = $props();
</script>

<span class="font-medium">{leverage ? `${leverage}x` : '-'}</span>
