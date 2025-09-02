<script lang="ts">
	const { status, className } = $props<{
		status: 'open' | 'closed';
		className?: string;
	}>();
</script>

<div
	class="px-2 py-1 rounded-full text-xs font-medium w-[60px] text-center {className}"
	class:bg-green-100={status === 'open'}
	class:text-green-800={status === 'open'}
	class:bg-red-100={status === 'closed'}
	class:text-red-800={status === 'closed'}
>
	{status.charAt(0).toUpperCase() + status.slice(1)}
</div>
