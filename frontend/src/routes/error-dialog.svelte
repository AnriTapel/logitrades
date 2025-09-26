<script lang="ts">
	import { clearServerErrors, errorState } from '$lib/stores/error';
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';

	function handleClose() {
		clearServerErrors();
	}
</script>

{#if $errorState}
	<CommonDialog
		open={true}
		title="Error"
		onCancel={handleClose}
		showSubmit={false}
		cancelText="Ok"
	>
		<div class="pt-4 pb-4">
			{#each $errorState as error}
				<p class="text-l mb-1">{error}</p>
			{/each}
		</div>
	</CommonDialog>
{/if}
