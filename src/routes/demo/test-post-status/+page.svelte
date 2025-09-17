<script>
	/** @type {import('./$types').PageData} */
	export let data;
	import { goto } from '$app/navigation';

	function navigateToDemo() {
		const url = '/demo';
		goto(url, { replaceState: true });
	}

	// Function to get appropriate color for status
	function getStatusColor(status) {
		switch (status) {
			case 'DRAFT':
				return 'bg-gray-100 text-gray-800';
			case 'REVIEW':
				return 'bg-yellow-100 text-yellow-800';
			case 'PUBLISHED':
				return 'bg-green-100 text-green-800';
			case 'ARCHIVED':
				return 'bg-blue-100 text-blue-800';
			case 'DELETED':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Post Status Enum Test</h1>

	<div class="mb-6 rounded bg-gray-100 p-4">
		<h2 class="mb-2 text-xl font-semibold">Available Status Values:</h2>
		<div class="flex flex-wrap gap-2">
			{#each data.statusValues as status (status)}
				<span class="rounded px-3 py-1 {getStatusColor(status)}">{status}</span>
			{/each}
		</div>
	</div>

	<div class="mb-6">
		<h2 class="mb-2 text-xl font-semibold">Status Distribution:</h2>
		{#if data.statusCounts.length === 0}
			<p>No posts found in the database.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
				{#each data.statusCounts as { status, count } (status)}
					<div class="rounded border p-4 {getStatusColor(status)}">
						<div class="text-lg font-semibold">{status}</div>
						<div class="text-2xl font-bold">{count}</div>
						<div class="text-sm">posts</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<h2 class="mb-2 text-xl font-semibold">Recent Posts:</h2>

	{#if data.posts.length === 0}
		<p>No posts found. Please create some posts first.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full bg-white">
				<thead class="bg-gray-200">
					<tr>
						<th class="px-4 py-2 text-left">ID</th>
						<th class="px-4 py-2 text-left">Title</th>
						<th class="px-4 py-2 text-left">Slug</th>
						<th class="px-4 py-2 text-left">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.posts as post (post.id)}
						<tr class="border-b">
							<td class="px-4 py-2">{post.id}</td>
							<td class="px-4 py-2">{post.title}</td>
							<td class="px-4 py-2">{post.slug}</td>
							<td class="px-4 py-2">
								<span class="rounded px-2 py-1 {getStatusColor(post.status)}">
									{post.status}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<div class="mt-6">
		<button
			on:click={navigateToDemo}
			class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
			Back to Demo
		</button>
	</div>
</div>
