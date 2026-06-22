<script lang="ts">
	const { quantity, leverage }: { quantity: number; leverage: number | null } =
		$props();
</script>

<span>{quantity} {leverage ? `(x${leverage})` : ''}</span>
