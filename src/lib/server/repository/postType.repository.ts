import { db } from '$lib/server/db';
import { postTypes } from '$lib/server/db/schema/postTypes';
import type { PostTypeOrm } from '$lib/server/db/schema/postTypes';
import type { PostType, PostTypeCreate } from '$lib/server/service/postType.service';
import { BaseDrizzleRepository } from '$lib/server/repository/base';

function toEntity(row: PostTypeOrm): PostType {
	return {
		id: row.id,
		uid: row.uid,
		version: row.version,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		code: row.code,
		name: row.name
	};
}

class PostTypeRepository extends BaseDrizzleRepository<PostType, PostTypeCreate> {
	constructor() {
		super({
			db,
			table: postTypes,
			toEntity,
			mapCreate: ({ code, name }) => ({ code, name }),
			mapUpdate: (entity: PostType) => ({ ...entity }),
			idCol: postTypes.id,
			uidCol: postTypes.uid,
			versionCol: postTypes.version,
			updatedAtCol: postTypes.updatedAt
		});
	}

	async getByCode(code: string): Promise<PostType | null> {
		const row = await db.query.postTypes.findFirst({ where: (pt, { eq }) => eq(pt.code, code) });
		return row ? toEntity(row) : null;
	}
}

export const postTypeRepository = new PostTypeRepository();
