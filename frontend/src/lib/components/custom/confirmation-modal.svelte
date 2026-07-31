<script lang="ts">
	import CommonDialog from '$lib/components/ui/dialog/common-dialog.svelte';
	import type { ButtonVariant } from '$lib/components/ui/button/button.svelte';

	let {
		open,
		title,
		message,
		confirmButtonText = 'Confirm',
		rejectButtonText = 'Cancel',
		confirmVariant = 'destructive' as ButtonVariant,
		onConfirm = () => {},
		onReject = () => {},
	}: {
		open: boolean;
		title: string;
		message: string;
		confirmButtonText?: string;
		rejectButtonText?: string;
		confirmVariant?: ButtonVariant;
		onConfirm?: () => void;
		onReject?: () => void;
	} = $props();
</script>

<CommonDialog
	{open}
	{title}
	submitText={confirmButtonText}
	cancelText={rejectButtonText}
	submitVariant={confirmVariant}
	onSubmit={onConfirm}
	onCancel={onReject}
>
	<p class="text-sm text-muted-foreground">{message}</p>
</CommonDialog>
