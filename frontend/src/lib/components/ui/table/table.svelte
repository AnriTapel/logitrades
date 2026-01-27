<script lang="ts">
	import type { HTMLTableAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type $$Props = HTMLTableAttributes & {
		noWrapper?: boolean;
	};

	let className: $$Props['class'] = undefined;
	let noWrapper: $$Props['noWrapper'] = false;
	export { className as class, noWrapper as noWrapper };
</script>

{#if noWrapper}
	<table
		class={cn('w-full caption-bottom text-sm', className)}
		{...$$restProps}
	>
		<slot />
	</table>
{:else}
	<div class="relative w-full overflow-auto">
		<table
			class={cn('w-full caption-bottom text-sm', className)}
			{...$$restProps}
		>
			<slot />
		</table>
	</div>
{/if}
