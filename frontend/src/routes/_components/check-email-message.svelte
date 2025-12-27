<script lang="ts">
	import MailIcon from '@lucide/svelte/icons/mail';

	let { message }: { message: string } = $props();
</script>

<div class="flex flex-col items-center gap-4">
	<MailIcon class="size-12" />
	<h1 class="text-2xl font-bold">Check Your Email</h1>
	<p class="text-muted-foreground">
		{message}
	</p>
	<p class="text-sm text-muted-foreground">
		Don't forget to check your spam folder if you don't see the email.
	</p>
</div>
