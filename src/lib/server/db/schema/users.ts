import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
import { citext } from '../extensions';

// Users table
export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	uid: uuid('uid').notNull().unique(),
	version: integer('version').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	username: citext('username').notNull().unique(),
	email: citext('email').notNull().unique(),
	password: text('password').notNull(),
	role: integer('role').notNull().default(0)
});

// Export type
export type User = typeof users.$inferSelect;