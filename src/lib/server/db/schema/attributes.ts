import { pgTable, serial, integer, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

// Attributes table
export const attributes = pgTable(
	'attributes',
	{
		id: serial('id').primaryKey(),
		uid: uuid('uid').notNull().unique(),
		version: integer('version').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		name: text('name').notNull(),
		entityType: text('entity_type').notNull(),
		dataType: text('data_type').notNull()
	},
	(table) => {
		return {
			entityTypeNameUnique: uniqueIndex('UN_attributes_entity_type_name').on(
				table.entityType,
				table.name
			)
		};
	}
);

// Export types
export type AttributeOrm = typeof attributes.$inferSelect;
