import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

// Handle authentication
export const handle: Handle = async ({ event, resolve }) => {
	// Get session ID from cookie
	const sessionId = lucia.readSessionCookie(event.request.headers.get('cookie') || '');

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	// Validate session
	const { session, user } = await lucia.validateSession(sessionId);

	if (session && session.fresh) {
		// Session was refreshed, set new cookie with non-null values
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: sessionCookie.attributes.path || '/',
			secure: sessionCookie.attributes.secure || false,
			httpOnly: sessionCookie.attributes.httpOnly || true,
			maxAge: sessionCookie.attributes.maxAge,
			sameSite: sessionCookie.attributes.sameSite || 'lax'
		});
	}

	if (!session) {
		// Invalid session, clear cookie with non-null values
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: sessionCookie.attributes.path || '/',
			secure: sessionCookie.attributes.secure || false,
			httpOnly: sessionCookie.attributes.httpOnly || true,
			maxAge: sessionCookie.attributes.maxAge,
			sameSite: sessionCookie.attributes.sameSite || 'lax'
		});
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};
