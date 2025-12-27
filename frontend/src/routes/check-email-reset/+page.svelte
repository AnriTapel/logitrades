<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import MailIcon from '@lucide/svelte/icons/mail';
</script>

<div class="flex items-center justify-center min-h-screen">
	<div
		class="w-full max-w-md p-8 space-y-6 text-center flex flex-col items-center"
	>
		<MailIcon class="size-12" />
		<h1 class="text-2xl font-bold">Check Your Email</h1>
		<p class="text-muted-foreground">
			If an account with that email exists, we've sent a password reset link.
			Please check your inbox.
		</p>
		<p class="text-sm text-muted-foreground">
			Don't forget to check your spam folder if you don't see the email.
		</p>
		<div class="flex flex-col gap-3 pt-4">
			<Button variant="ghost" onclick={() => goto('/login')}>
				Back to Login
			</Button>
		</div>
	</div>
</div>

