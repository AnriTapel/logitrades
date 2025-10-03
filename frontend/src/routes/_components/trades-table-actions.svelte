<script lang="ts">
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';

	let {
		id,
		onEdit,
		onDelete,
	}: {
		id: number;
		onEdit: (id: number) => void;
		onDelete: (id: number) => void;
	} = $props();

	function handleEditClick() {
		onEdit(id);
	}

	function handleDeleteClick() {
		onDelete(id);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={buttonVariants({
			variant: 'ghost',
			size: 'icon',
			class: 'relative h-8 w-8 p-0',
		})}
	>
		<Ellipsis class="h-4 w-4" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item onclick={handleEditClick}>Edit</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleDeleteClick}>Delete</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
