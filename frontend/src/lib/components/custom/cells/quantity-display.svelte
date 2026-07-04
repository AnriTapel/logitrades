<script lang="ts">
	const { quantity, leverage }: { quantity: number; leverage: number | null } =
		$props();
</script>

<div class="text-sm font-medium w-[100px]">
	{quantity}
	{leverage ? `(x${leverage})` : ''}
</div>
