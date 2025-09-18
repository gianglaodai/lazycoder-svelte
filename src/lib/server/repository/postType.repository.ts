import { postTypes } from '$lib/server/db/schema/postTypes';
import type { PostTypeOrm } from '$lib/server/db/schema/postTypes';
import type { PostType, PostTypeCreate } from '$lib/server/service/postType.service';
import { BaseDrizzleRepository } from '$lib/server/repository/base';
import { eq } from 'drizzle-orm';
import { Transactional } from '$lib/server/service/transaction';

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
			table: postTypes,
			toEntity,
			mapCreate: ({ code, name }) => ({ code, name }),
			mapUpdate: (entity: PostType) => ({ ...entity }),
		});
	}

	protected override getColumnMap(): Record<string, any> {
		return {
			...super.getColumnMap(),
			code: postTypes.code,
			name: postTypes.name
		};
	}

	@Transactional
	async getByCode(code: string): Promise<PostType | null> {
		const rows = await this.getDb()
			.select()
			.from(this.table)
			.where(eq(postTypes.code, code))
			.limit(1);
		return rows[0] ? toEntity(rows[0] as PostTypeOrm) : null;
	}
}

export const postTypeRepository = new PostTypeRepository();
