import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	uuid,
	doublePrecision,
	boolean,
	date,
	time,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { attributes } from './attributes';

// Attribute values table
export const attributeValues = pgTable(
	'attribute_values',
	{
		id: serial('id').primaryKey(),
		uid: uuid('uid').notNull().unique(),
		version: integer('version').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		intValue: integer('int_value'),
		doubleValue: doublePrecision('double_value'),
		stringValue: text('string_value'),
		booleanValue: boolean('boolean_value'),
		dateValue: date('date_value'),
		datetimeValue: timestamp('datetime_value', { withTimezone: true }),
		timeValue: time('time_value'),
		attributeId: integer('attribute_id')
			.notNull()
			.references(() => attributes.id, { onDelete: 'cascade' }),
		entityId: integer('entity_id').notNull(),
		entityType: text('entity_type').notNull()
	},
	(table) => {
		return {
			entityTypeEntityIdAttributeIdUnique: uniqueIndex(
				'UN_attribute_values_entity_type_entity_id_attribute_id'
			).on(table.entityType, table.entityId, table.attributeId)
		};
	}
);

// Export types
export type AttributeValueOrm = typeof attributeValues.$inferSelect;
