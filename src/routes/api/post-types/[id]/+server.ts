import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { postTypeService } from '$lib/server/service/postType.service';
import type { PostType } from '$lib/server/service/postType.service';
import type { PostTypeTO } from '../+server';

// Reuse TO converters from collection file shape
function toTO(bo: PostType): PostTypeTO {
	return {
		id: bo.id,
		uid: bo.uid,
		version: bo.version,
		createdAt: bo.createdAt,
		updatedAt: bo.updatedAt,
		code: bo.code,
		name: bo.name
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	try {
		const item = await postTypeService.getById(id);
		return json(toTO(item));
	} catch (e: any) {
		if (e?.message === 'Not found') throw error(404, 'Not found');
		throw error(500, 'Failed to fetch post type');
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	const body = (await request.json()) as Partial<PostTypeTO>;
	const updated = await postTypeService.update(id, {
		id: body.id,
		uid: body.uid,
		version: body.version,
		createdAt: body.createdAt,
		updatedAt: body.updatedAt,
		code: body.code,
		name: body.name
	} as PostType);
	return json(toTO(updated));
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	try {
		await postTypeService.deleteById(id);
		return new Response(null, { status: 204 });
	} catch (e: any) {
		if (e?.message === 'Not found') throw error(404, 'Not found');
		throw error(500, 'Failed to delete post type');
	}
};
