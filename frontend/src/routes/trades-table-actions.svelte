<script lang="ts">
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';

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
	<DropdownMenu.Trigger asChild let:builder>
		<Button
			variant="ghost"
			builders={[builder]}
			size="icon"
			class="relative h-8 w-8 p-0"
		>
			<span class="sr-only">Open menu</span>
			<Ellipsis class="h-4 w-4" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item on:click={handleEditClick}>Edit</DropdownMenu.Item>
		<DropdownMenu.Item on:click={handleDeleteClick}>Delete</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
