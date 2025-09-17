<script>
	/** @type {import('./$types').PageData} */
	export let data;
	import { goto } from '$app/navigation';

	function navigateToLuciaDemo() {
		goto('/demo/lucia', { replaceState: true });
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">User Role Enum Test</h1>

	<div class="mb-6 rounded bg-gray-100 p-4">
		<h2 class="mb-2 text-xl font-semibold">Available Role Values:</h2>
		<div class="flex gap-2">
			{#each data.roleValues as role (role)}
				<span class="rounded bg-blue-100 px-3 py-1 text-blue-800">{role}</span>
			{/each}
		</div>
	</div>

	<div class="mb-4">
		<p class="text-lg font-medium">{data.message}</p>
	</div>

	<h2 class="mb-2 text-xl font-semibold">Users:</h2>

	{#if data.users.length === 0}
		<p>No users found. Please register a user first.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full bg-white">
				<thead class="bg-gray-200">
					<tr>
						<th class="px-4 py-2 text-left">ID</th>
						<th class="px-4 py-2 text-left">Username</th>
						<th class="px-4 py-2 text-left">Email</th>
						<th class="px-4 py-2 text-left">Role</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as user (user.id)}
						<tr class="border-b">
							<td class="px-4 py-2">{user.id}</td>
							<td class="px-4 py-2">{user.username}</td>
							<td class="px-4 py-2">{user.email}</td>
							<td class="px-4 py-2">
								<span
									class="rounded px-2 py-1 {user.role === 'ADMIN'
										? 'bg-red-100 text-red-800'
										: 'bg-green-100 text-green-800'}">
									{user.role}
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
			on:click={navigateToLuciaDemo}
			class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
			Back to Lucia Demo
		</button>
	</div>
</div>
