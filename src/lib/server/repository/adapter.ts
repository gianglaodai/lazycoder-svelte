import type { Filter } from '$lib/server/service/filter';
import type { Sort } from '$lib/server/service/sort';

/**
 * Database adapter interface for converting business logic filters and sorts
 * to database-specific query conditions and orders.
 */
export interface DatabaseAdapter<TCondition, TOrder> {
	/**
	 * Converts a Filter to a database-specific condition.
	 *
	 * @param filter The filter to convert
	 * @returns A database-specific condition
	 */
	toCondition(filter: Filter): TCondition;

	/**
	 * Converts a Sort to a database-specific order.
	 *
	 * @param sort The sort to convert
	 * @returns A database-specific order
	 */
	toOrder(sort: Sort): TOrder;

	/**
	 * Combines multiple conditions with AND logic.
	 *
	 * @param conditions The conditions to combine
	 * @returns A combined condition
	 */
	and(...conditions: TCondition[]): TCondition;

	/**
	 * Combines multiple conditions with OR logic.
	 *
	 * @param conditions The conditions to combine
	 * @returns A combined condition
	 */
	or(...conditions: TCondition[]): TCondition;
}
