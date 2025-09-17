import { pgTable, serial, integer, text, timestamp, uuid, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Post collections table
export const postCollections = pgTable(
	'post_collections',
	{
		id: serial('id').primaryKey(),
		uid: uuid('uid').notNull().unique(),
		version: integer('version').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		description: text('description'),
		visibility: text('visibility').notNull().default('public')
	},
	() => {
		return {
			visibilityCheck: check(
				'CK_post_collections_visibility',
				sql`visibility IN ('public','private','unlisted')`
			),
			slugCheck: check('CK_post_collections_slug', sql`slug ~ '^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$'`)
		};
	}
);

// Export types
export type PostCollectionOrm = typeof postCollections.$inferSelect;
