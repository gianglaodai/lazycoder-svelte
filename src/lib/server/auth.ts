import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema/auth';
import { users, userRoleEnum } from '$lib/server/db/schema/users';

// Create Lucia adapter for Drizzle
const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

// Create Lucia instance
export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// Set secure to true in production
			secure: !dev,
			// Domain and path settings if needed
			path: '/'
		}
	},
	getUserAttributes: (attributes) => {
		return {
			// Return user attributes you want to access
			username: attributes.username,
			email: attributes.email,
			role: attributes.role
		};
	}
});

// For TypeScript users
declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			username: string;
			email: string;
			role: (typeof userRoleEnum.enumValues)[number];
		};
	}
}

// Export session cookie name for compatibility with existing code
export const sessionCookieName = lucia.sessionCookieName;

// Helper functions for compatibility with existing code
export async function validateSession(request: Request) {
	const sessionId = lucia.readSessionCookie(request.headers.get('Cookie') || '');
	if (!sessionId) {
		return { session: null, user: null };
	}

	const { session, user } = await lucia.validateSession(sessionId);
	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSession>>;

export async function invalidateSession(sessionId: string) {
	await lucia.invalidateSession(sessionId);
}

// For compatibility with existing code
export function setSessionCookie(response: Response, sessionId: string) {
	const sessionCookie = lucia.createSessionCookie(sessionId);
	response.headers.append('Set-Cookie', sessionCookie.serialize());
}

export function deleteSessionCookie(response: Response) {
	const sessionCookie = lucia.createBlankSessionCookie();
	response.headers.append('Set-Cookie', sessionCookie.serialize());
}
