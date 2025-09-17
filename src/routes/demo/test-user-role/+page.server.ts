import { db } from '$lib/server/db';
import { users, userRoleEnum } from '$lib/server/db/schema/users';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get all users with their roles
	const allUsers = await db.query.users.findMany({
		columns: {
			id: true,
			username: true,
			email: true,
			role: true
		}
	});

	// Create a test user with ADMIN role if it doesn't exist
	const adminExists = allUsers.some((user) => user.role === 'ADMIN');

	if (!adminExists && allUsers.length > 0) {
		// Update the first user to ADMIN role for testing
		const firstUser = allUsers[0];
		await db.update(users).set({ role: 'ADMIN' }).where(eq(users.id, firstUser.id));

		// Refresh the user list
		const updatedUsers = await db.query.users.findMany({
			columns: {
				id: true,
				username: true,
				email: true,
				role: true
			}
		});

		return {
			users: updatedUsers,
			roleValues: userRoleEnum.enumValues,
			message: `Updated user ${firstUser.username} to ADMIN role`
		};
	}

	return {
		users: allUsers,
		roleValues: userRoleEnum.enumValues,
		message: adminExists ? 'Admin user already exists' : 'No users found'
	};
};
