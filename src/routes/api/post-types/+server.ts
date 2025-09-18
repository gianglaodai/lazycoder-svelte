import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { postTypeService } from '$lib/server/service/postType.service';
import type { PostType } from '$lib/server/service/postType.service';

// TOs
import type { TransferObject } from '$lib/types/base';
export interface PostTypeTO extends TransferObject {
	id: number;
	uid: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
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
		createdAt: bo.createdAt,
		updatedAt: bo.updatedAt,
		code: bo.code,
		name: bo.name
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as Partial<CreatePostTypeTO>;
	if (!body || typeof body.code !== 'string' || typeof body.name !== 'string') {
		throw error(400, 'Invalid payload');
	}
	try {
		const created = await postTypeService.create({
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
