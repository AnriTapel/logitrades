import { error } from '@sveltejs/kit';

export async function DELETE({ params, fetch }) {
	const { id } = params;
	const response = await fetch(`http://localhost:8000/trades/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		throw error(500, 'Failed to delete trade');
	}

	return new Response(JSON.stringify({ success: true }), { status: 200 });
}
