import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	uuid,
	uniqueIndex,
	index,
	check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { postTaxonomies } from './postTaxonomies';

// Forward declaration for terms table to handle self-reference
const termsRef = pgTable('terms', {
	id: serial('id').primaryKey()
});

// Terms table
export const terms = pgTable(
	'terms',
	{
		id: serial('id').primaryKey(),
		uid: uuid('uid').notNull().unique(),
		version: integer('version').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		taxonomyId: integer('taxonomy_id')
			.notNull()
			.references(() => postTaxonomies.id, { onDelete: 'cascade' }),
		parentId: integer('parent_id').references(() => termsRef.id, { onDelete: 'set null' }),
		slug: text('slug').notNull(),
		name: text('name').notNull(),
		description: text('description')
	},
	(table) => {
		return {
			taxonomySlugUnique: uniqueIndex('UN_terms_taxonomy_id_slug').on(table.taxonomyId, table.slug),
			slugCheck: check('CK_terms_slug', sql`slug ~ '^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$'`),
			taxonomyParentIdx: index('IDX_terms_taxonomy_parent').on(table.taxonomyId, table.parentId)
		};
	}
);

// Export type
export type Term = typeof terms.$inferSelect;