import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema/users';
import { keys } from '$lib/server/db/schema/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/lucia');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, {
				message: 'Invalid username (min 3, max 31 characters, alphanumeric only)'
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
		}

		// Find user by username
		const existingUser = await db.query.users.findFirst({
			where: eq(users.username, username)
		});

		if (!existingUser) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		// Find key for this user
		const key = await db.query.keys.findFirst({
			where: eq(keys.userId, existingUser.id)
		});

		if (!key || !key.hashedPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		// Verify password
		const validPassword = await verify(key.hashedPassword, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		// Create new session with Lucia
		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		// Set cookie
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: sessionCookie.attributes.path || '/',
			secure: sessionCookie.attributes.secure,
			httpOnly: sessionCookie.attributes.httpOnly,
			maxAge: sessionCookie.attributes.maxAge,
			sameSite: sessionCookie.attributes.sameSite
		});

		return redirect(302, '/demo/lucia');
	},
	register: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, { message: 'Invalid username' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' });
		}

		const userId = generateUserId();
		const hashedPassword = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			// Create user with required fields
			await db.insert(users).values({
				id: userId,
				uid: crypto.randomUUID(), // Generate UUID for uid field
				username,
				email: `${username}@example.com`, // Default email for demo
				role: 'USER',
				version: 0,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Create key for password
			await db.insert(keys).values({
				id: `username:${username}`,
				userId,
				hashedPassword
			});

			// Create session
			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			// Set cookie
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: sessionCookie.attributes.path || '/',
				secure: sessionCookie.attributes.secure,
				httpOnly: sessionCookie.attributes.httpOnly,
				maxAge: sessionCookie.attributes.maxAge,
				sameSite: sessionCookie.attributes.sameSite
			});
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'An error has occurred' });
		}

		return redirect(302, '/demo/lucia');
	}
};

function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
