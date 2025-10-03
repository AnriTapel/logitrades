<script lang="ts">
	import '../app.pcss';
	import ErrorDialog from './_components/error-dialog.svelte';
	import DashboardPreview from './dashboard-preview.svelte';
</script>

<div class="container mx-auto p-4">
	<slot />
	<DashboardPreview />
	<ErrorDialog />
</div>
