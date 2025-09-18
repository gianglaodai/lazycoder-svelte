import { db } from '$lib/server/db';
import { postTypes } from '$lib/server/db/schema/postTypes';
import type { PostTypeOrm } from '$lib/server/db/schema/postTypes';
import { and, eq } from 'drizzle-orm';
import type { PostType } from '$lib/server/service/postType.service';

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

export const postTypeRepository = {
	async list(limit = 50, offset = 0): Promise<PostType[]> {
		const rows = await db.query.postTypes.findMany({
			limit,
			offset,
			orderBy: (pt, { asc }) => [asc(pt.id)]
		});
		return rows.map(toEntity);
	},

	async getById(id: number): Promise<PostType | null> {
		const row = await db.query.postTypes.findFirst({ where: (pt, { eq }) => eq(pt.id, id) });
		return row ? toEntity(row) : null;
	},

	async getByCode(code: string): Promise<PostType | null> {
		const row = await db.query.postTypes.findFirst({ where: (pt, { eq }) => eq(pt.code, code) });
		return row ? toEntity(row) : null;
	},

	async create(input: { uid: string; code: string; name: string }): Promise<PostType> {
		const [row] = await db
			.insert(postTypes)
			.values({ uid: input.uid, code: input.code, name: input.name })
			.returning();
		return toEntity(row);
	},

	async update(
		id: number,
		input: { code?: string; name?: string; expectedVersion: number }
	): Promise<PostType | null> {
		// optimistic locking by version
		const [row] = await db
			.update(postTypes)
			.set({
				...(input.code !== undefined ? { code: input.code } : {}),
				...(input.name !== undefined ? { name: input.name } : {}),
				version: input.expectedVersion + 1,
				updatedAt: new Date()
			})
			.where(and(eq(postTypes.id, id), eq(postTypes.version, input.expectedVersion)))
			.returning();

		if (!row) return null;
		if (row.version !== input.expectedVersion + 1) {
			// In Neon + drizzle returning already returns updated values; but we didn't check previous version match.
			// To minimize queries, verify after update by ensuring previous version existed.
			// However drizzle can't condition update on previous version without custom where; keep simple for now.
		}
		return toEntity(row);
	},

	async delete(id: number): Promise<boolean> {
		const [row] = await db
			.delete(postTypes)
			.where(eq(postTypes.id, id))
			.returning({ id: postTypes.id });
		return !!row;
	}
};
