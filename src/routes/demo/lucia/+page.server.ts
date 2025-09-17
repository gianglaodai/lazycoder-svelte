import { lucia } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const user = requireLogin();
	return { user };
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}

		// Invalidate the session with Lucia
		await lucia.invalidateSession(event.locals.session.id);

		// Clear the session cookie
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: sessionCookie.attributes.path || '/',
			secure: sessionCookie.attributes.secure,
			httpOnly: sessionCookie.attributes.httpOnly,
			maxAge: sessionCookie.attributes.maxAge,
			sameSite: sessionCookie.attributes.sameSite
		});

		return redirect(302, '/demo/lucia/login');
	}
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/demo/lucia/login');
	}

	return locals.user;
}
