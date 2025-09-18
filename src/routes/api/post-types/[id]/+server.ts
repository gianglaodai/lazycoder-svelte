import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { postTypeService } from '$lib/server/service/postType.service';
import type { PostType } from '$lib/server/service/postType.service';

// Reuse TO converters from collection file shape
function toTO(bo: PostType) {
	return {
		id: bo.id,
		uid: bo.uid,
		version: bo.version,
		createdAt: bo.createdAt.toISOString(),
		updatedAt: bo.updatedAt.toISOString(),
		code: bo.code,
		name: bo.name
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	try {
		const item = await postTypeService.get(id);
		return json(toTO(item));
	} catch (e: any) {
		if (e?.message === 'Not found') throw error(404, 'Not found');
		throw error(500, 'Failed to fetch post type');
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	const body = (await request.json()) as Partial<{ code: string; name: string; version: number }>;
	if (!body || typeof body.version !== 'number') throw error(400, 'Expected version');
	try {
		const updated = await postTypeService.update(id, {
			code: body.code,
			name: body.name,
			expectedVersion: body.version
		});
		return json(toTO(updated));
	} catch (e: any) {
		if (e?.message === 'Not found') throw error(404, 'Not found');
		if (e?.message === 'Code already exists') throw error(409, e.message);
		if (e?.message === 'Version conflict') throw error(409, e.message);
		if (e?.message === 'Invalid code format') throw error(400, e.message);
		throw error(500, 'Failed to update post type');
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	try {
		await postTypeService.delete(id);
		return new Response(null, { status: 204 });
	} catch (e: any) {
		if (e?.message === 'Not found') throw error(404, 'Not found');
		throw error(500, 'Failed to delete post type');
	}
};
