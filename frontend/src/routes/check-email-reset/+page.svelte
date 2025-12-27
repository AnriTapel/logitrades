<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import CheckEmailMessage from '../_components/check-email-message.svelte';
</script>

<div class="flex items-center justify-center min-h-screen">
	<div
		class="w-full max-w-md p-8 space-y-6 text-center flex flex-col items-center"
	>
		<CheckEmailMessage
			message="If an account with that email exists, we've sent a password reset link. Please check your inbox."
		/>
		<div class="flex flex-col gap-3 pt-4">
			<Button variant="ghost" onclick={() => goto('/login')}>
				Back to Login
			</Button>
		</div>
	</div>
</div>
