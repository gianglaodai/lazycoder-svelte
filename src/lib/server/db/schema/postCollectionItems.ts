import {
	pgTable,
	integer,
	text,
	uniqueIndex,
	index,
	primaryKey,
	check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { postCollections } from './postCollections';
import { posts } from './posts';

// Post collection items table
export const postCollectionItems = pgTable(
	'post_collection_items',
	{
		postCollectionId: integer('post_collection_id')
			.notNull()
			.references(() => postCollections.id, { onDelete: 'cascade' }),
		postId: integer('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		headline: text('headline')
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.postCollectionId, table.postId] }),
			positionUnique: uniqueIndex('UN_post_collection_items_position').on(
				table.postCollectionId,
				table.position
			),
			positionCheck: check('CK_post_collection_items_position', sql`position > 0`),
			postCollectionPositionIdx: index('IDX_post_collection_items_post_collection_id_position').on(
				table.postCollectionId,
				table.position
			)
		};
	}
);

// Export type
export type PostCollectionItem = typeof postCollectionItems.$inferSelect;