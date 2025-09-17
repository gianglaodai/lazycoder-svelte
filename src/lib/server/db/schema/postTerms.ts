import {
	pgTable,
	integer,
	index,
	primaryKey
} from 'drizzle-orm/pg-core';
import { posts } from './posts';
import { terms } from './terms';

// Post terms table
export const postTerms = pgTable(
	'post_terms',
	{
		postId: integer('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		termId: integer('term_id')
			.notNull()
			.references(() => terms.id, { onDelete: 'cascade' })
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.postId, table.termId] }),
			termIdIdx: index('IDX_post_terms_term_id').on(table.termId),
			postIdIdx: index('IDX_post_terms_post_id').on(table.postId)
		};
	}
);

// Export type
export type PostTerm = typeof postTerms.$inferSelect;