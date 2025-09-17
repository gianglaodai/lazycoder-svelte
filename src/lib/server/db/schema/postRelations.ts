import {
	pgTable,
	integer,
	text,
	index,
	primaryKey,
	check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { posts } from './posts';

// Post relations table
export const postRelations = pgTable(
	'post_relations',
	{
		fromPost: integer('from_post')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		toPost: integer('to_post')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		relType: text('rel_type').notNull()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.fromPost, table.toPost, table.relType] }),
			relTypeCheck: check(
				'CK_post_relations_type',
				sql`rel_type IN ('related','next','prev','see_also')`
			),
			fromPostIdx: index('IDX_post_relations_from_post').on(table.fromPost),
			toPostIdx: index('IDX_post_relations_to_post').on(table.toPost)
		};
	}
);

// Export type
export type PostRelation = typeof postRelations.$inferSelect;