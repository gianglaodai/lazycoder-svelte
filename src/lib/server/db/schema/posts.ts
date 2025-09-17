import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	uuid,
	uniqueIndex,
	index,
	check,
	pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { postTypes } from './postTypes';

// Post status enum
export const postStatusEnum = pgEnum('post_status', [
	'DRAFT',
	'REVIEW',
	'PUBLISHED',
	'ARCHIVED',
	'DELETED'
]);

// Posts table
export const posts = pgTable(
	'posts',
	{
		id: serial('id').primaryKey(),
		uid: uuid('uid').notNull().unique(),
		version: integer('version').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		summary: text('summary'),
		content: text('content'),
		status: postStatusEnum('status').notNull().default('DRAFT'),
		visibility: text('visibility').notNull().default('public'),
		format: text('format').notNull().default('markdown'),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		typeId: integer('type_id')
			.notNull()
			.references(() => postTypes.id, { onDelete: 'cascade' })
	},
	(table) => {
		return {
			typeSlugUnique: uniqueIndex('UN_posts_type_slug').on(table.typeId, table.slug),
			// Status check is no longer needed as the enum type enforces valid values
			slugCheck: check('CK_posts_slug', sql`slug ~ '^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$'`),
			visibilityCheck: check(
				'CK_posts_visibility',
				sql`visibility IN ('public','private','unlisted','members')`
			),
			formatCheck: check('CK_posts_format', sql`format IN ('markdown','html','mdx','plaintext')`),
			userIdIdx: index('IDX_posts_user_id').on(table.userId),
			statusIdx: index('IDX_posts_status').on(table.status),
			publishedAtIdx: index('IDX_posts_published_at').on(table.publishedAt),
			userIdStatusIdx: index('IDX_posts_user_id_status').on(table.userId, table.status),
			typeIdIdx: index('IDX_posts_type_id').on(table.typeId),
			typeSlugIdx: index('IDX_posts_type_slug').on(table.typeId, table.slug),
			publishedVisibilityIdx: index('IDX_posts_published_visibility').on(
				table.publishedAt,
				table.visibility
			)
		};
	}
);

// Export types
export type PostOrm = typeof posts.$inferSelect;
