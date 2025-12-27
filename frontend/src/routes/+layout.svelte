<script lang="ts">
	import '../app.pcss';
	import ErrorDialog from '$lib/layouts/error-dialog.svelte';
	import { setAuth, clearAuth } from '$lib/stores/auth';

	let { children, data } = $props();

	// Sync auth state from server data
	$effect(() => {
		if (data.isAuthenticated && data.user) {
			setAuth(data.user);
		} else {
			clearAuth();
		}
	});
</script>

<div class="container mx-auto p-4">
	{@render children()}
	<ErrorDialog />
</div>
