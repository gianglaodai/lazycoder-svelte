import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	uuid,
	check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Post types table
export const postTypes = pgTable(
	'post_types',
	{
		id: serial('id').primaryKey(),
		uid: uuid('uid').notNull().unique(),
		version: integer('version').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		code: text('code').notNull().unique(),
		name: text('name').notNull()
	},
	() => {
		return {
			codeCheck: check('CK_post_types_code', sql`code ~ '^[a-z0-9]+([a-z0-9_-]*[a-z0-9])?$'`)
		};
	}
);

// Export type
export type PostType = typeof postTypes.$inferSelect;