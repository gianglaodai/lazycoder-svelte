import type { UserService } from '$lib/server/service/user';
import type { ProfileService } from '$lib/server/service/profile';
import type { UserEntity } from '$lib/server/db/schema/users';
import type { ProfileEntity } from '$lib/server/db/schema/profiles';

/**
 * Example of using transactions in a real-world scenario
 *
 * This example demonstrates how to use transactions to ensure that multiple
 * operations either all succeed or all fail together.
 */

/**
 * Updates a user and their profile in a single transaction
 *
 * If either the user update or profile update fails, both operations will be rolled back.
 */
export async function updateUserAndProfile(
	userService: UserService,
	profileService: ProfileService,
	userId: number,
	userData: UserEntity,
	profileData: ProfileEntity
) {
	// Start a transaction using the userService
	return userService.withTransaction(async (txUserService) => {
		// Update the user within the transaction
		const updatedUser = await txUserService.update(userId, userData);

		// Get the profile service with the same transaction context
		const txProfileService = await profileService.withTransaction(async (s) => Promise.resolve(s));

		// Update the profile within the same transaction
		const updatedProfile = await txProfileService.update(updatedUser.profileId, profileData);

		// Return both updated entities
		// This will only be returned if both operations succeed
		// If any operation fails, the entire transaction will be rolled back
		return { user: updatedUser, profile: updatedProfile };
	});
}

/**
 * Creates a new user with a profile in a single transaction
 */
export async function createUserWithProfile(
	userService: UserService,
	profileService: ProfileService,
	userData: Omit<UserEntity, 'id' | 'uid' | 'version' | 'createdAt' | 'updatedAt'>,
	profileData: Omit<ProfileEntity, 'id' | 'uid' | 'version' | 'createdAt' | 'updatedAt'>
) {
	return userService.withTransaction(async (txUserService) => {
		// First create the profile
		const txProfileService = await profileService.withTransaction(async (s) => Promise.resolve(s));
		const profile = await txProfileService.create(profileData as any);

		// Then create the user with the profile ID
		const user = await txUserService.create({
			...userData,
			profileId: profile.id
		} as any);

		return { user, profile };
	});
}

/**
 * Transfers credits from one user to another in a single transaction
 */
export async function transferCredits(
	userService: UserService,
	fromUserId: number,
	toUserId: number,
	amount: number
) {
	return userService.withTransaction(async (txUserService) => {
		// Get both users
		const fromUser = await txUserService.getById(fromUserId);
		const toUser = await txUserService.getById(toUserId);

		// Check if the sender has enough credits
		if (fromUser.credits < amount) {
			throw new Error('Insufficient credits');
		}

		// Update the sender's credits
		const updatedFromUser = await txUserService.update(fromUserId, {
			...fromUser,
			credits: fromUser.credits - amount
		});

		// Update the receiver's credits
		const updatedToUser = await txUserService.update(toUserId, {
			...toUser,
			credits: toUser.credits + amount
		});

		return {
			from: updatedFromUser,
			to: updatedToUser,
			amount
		};
	});
}
