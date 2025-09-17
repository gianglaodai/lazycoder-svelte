import { customType } from 'drizzle-orm/pg-core';

// Define the citext extension type for PostgreSQL
export const citext = customType<{
	data: string;
	driverData: string;
}>({
	dataType() {
		return 'citext';
	},
	toDriver(value: string): string {
		return value;
	},
	fromDriver(value: string): string {
		return value;
	}
});
