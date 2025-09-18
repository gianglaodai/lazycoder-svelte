import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { postTypeService } from '$lib/server/service/postType.service';
import { randomUUID } from 'crypto';
import type { PostType } from '$lib/server/service/postType.service';

// TOs
import type { TransferObject } from '$lib/types/base';
export interface PostTypeTO extends TransferObject {
	code: string;
	name: string;
}

export type CreatePostTypeTO = {
	code: string;
	name: string;
};

function toTO(bo: PostType): PostTypeTO {
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

export const GET: RequestHandler = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit') ?? '50');
	const offset = Number(url.searchParams.get('offset') ?? '0');
	const data = await postTypeService.list(limit, offset);
	return json({ items: data.map(toTO), limit, offset });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as Partial<CreatePostTypeTO>;
	if (!body || typeof body.code !== 'string' || typeof body.name !== 'string') {
		throw error(400, 'Invalid payload');
	}
	try {
		const created = await postTypeService.create({
			uid: randomUUID(),
			code: body.code,
			name: body.name
		});
		return json(toTO(created), { status: 201 });
	} catch (e: any) {
		if (e?.message === 'Code already exists') throw error(409, e.message);
		if (e?.message === 'Invalid code format') throw error(400, e.message);
		throw error(500, 'Failed to create post type');
	}
};
