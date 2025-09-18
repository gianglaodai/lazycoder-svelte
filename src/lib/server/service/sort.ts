/**
 * Represents the direction of a sort operation.
 */
export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc'
}

/**
 * Represents a sort operation that can be applied to a query.
 */
export interface BaseSort {
	direction: SortDirection;
}

export interface FieldSort extends BaseSort {
	field_name: string;
}

export interface AttrSort extends BaseSort {
	attr_name: string;
}

export type Sort = FieldSort | AttrSort;

/**
 * Creates an ascending sort.
 */
export function ascSort(field_name_or_field: string, attr_name?: string): Sort {
	return { field_name: field_name_or_field, attr_name, direction: SortDirection.ASC };
}

/**
 * Creates a descending sort.
 */
export function descSort(field_name_or_field: string, attr_name?: string): Sort {
	return { field_name: field_name_or_field, attr_name, direction: SortDirection.DESC };
}
