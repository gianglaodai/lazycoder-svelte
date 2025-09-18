/**
 * Represents a filter operation that can be applied to a query.
 */
export enum FilterOperator {
	EQUAL = 'eq',
	NOT_EQUAL = 'ne',
	GREATER_THAN = 'gt',
	GREATER_THAN_OR_EQUAL = 'gte',
	LESS_THAN = 'lt',
	LESS_THAN_OR_EQUAL = 'lte',
	LIKE = 'like',
	NOT_LIKE = 'not_like',
	IS = 'is',
	IN = 'in',
	NOT_IN = 'not_in',
	IS_NULL = 'is_null',
	NOT_NULL = 'not_null',
	BETWEEN = 'between',
	NOT_BETWEEN = 'not_between'
}

/**
 * Represents the data type of a filter value.
 */
export enum DataType {
	STRING = 0,
	INTEGER = 1,
	FLOAT = 2,
	BOOLEAN = 3,
	DATE = 4,
	DATETIME = 5,
	TIME = 6
}

/**
 * Base interface for all filter types
 */
export interface BaseFilter {
	operator: FilterOperator;
	value?: any;
	dataType?: DataType;
}

/**
 * Represents a filter condition for a regular field.
 */
export interface FieldFilter extends BaseFilter {
	field_name: string;
}

/**
 * Represents a filter condition for an EAV attribute.
 */
export interface AttrFilter extends BaseFilter {
	attr_name: string;
}

/**
 * Union type for all filter types
 */
export type Filter = FieldFilter | AttrFilter;

/**
 * Parses a query parameter string into a Filter object.
 * Format: field_name:operator:value:data_type or attr_name:operator:value:data_type
 */
export function parseFilterParam(param: string, isAttrFilter: boolean = false): Filter {
	const parts = param.split(':');
	if (parts.length < 3) {
		throw new Error(
			`Invalid filter parameter: ${param}. Expected format: name:operator:value[:data_type]`
		);
	}

	const name = parts[0];
	const operatorStr = parts[1];
	const valueStr = parts[2];
	const dataTypeStr = parts.length > 3 ? parts[3] : '0'; // Default to STRING

	// Convert operator string to FilterOperator
	const operator = Object.values(FilterOperator).find((op) => op === operatorStr);
	if (!operator) {
		throw new Error(`Invalid operator: ${operatorStr}`);
	}

	// Convert data type string to DataType
	const dataType = parseInt(dataTypeStr) as DataType;
	if (isNaN(dataType) || dataType < 0 || dataType > 6) {
		throw new Error(`Invalid data type: ${dataTypeStr}`);
	}

	// Convert value string to appropriate type based on dataType
	let value: any = valueStr;
	switch (dataType) {
		case DataType.INTEGER:
			value = parseInt(valueStr);
			break;
		case DataType.FLOAT:
			value = parseFloat(valueStr);
			break;
		case DataType.BOOLEAN:
			value = valueStr.toLowerCase() === 'true';
			break;
		case DataType.DATE:
		case DataType.DATETIME:
		case DataType.TIME:
			value = new Date(valueStr);
			break;
	}

	// Create appropriate filter type
	if (isAttrFilter) {
		return { operator, attr_name: name, value, dataType };
	} else {
		return { operator, field_name: name, value, dataType };
	}
}

/**
 * Parses an array of field filter parameters.
 * Format: pF[]=field_name:operator:value:data_type
 */
export function parseFieldFilters(params: string[]): FieldFilter[] {
	return params.map((param) => parseFilterParam(param, false) as FieldFilter);
}

/**
 * Parses an array of attribute filter parameters.
 * Format: aF[]=attr_name:operator:value:data_type
 */
export function parseAttrFilters(params: string[]): AttrFilter[] {
	return params.map((param) => parseFilterParam(param, true) as AttrFilter);
}

// Helper functions for creating filters

/**
 * Creates an equal filter.
 */
export function eq(field_name: string, value: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.EQUAL, field_name, value, dataType };
}

/**
 * Creates an equal filter for an attribute.
 */
export function eqAttr(attr_name: string, value: any, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.EQUAL, attr_name, value, dataType };
}

/**
 * Creates a not equal filter.
 */
export function ne(field_name: string, value: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.NOT_EQUAL, field_name, value, dataType };
}

/**
 * Creates a not equal filter for an attribute.
 */
export function neAttr(attr_name: string, value: any, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.NOT_EQUAL, attr_name, value, dataType };
}

/**
 * Creates a greater than filter.
 */
export function gt(field_name: string, value: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.GREATER_THAN, field_name, value, dataType };
}

/**
 * Creates a greater than filter for an attribute.
 */
export function gtAttr(attr_name: string, value: any, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.GREATER_THAN, attr_name, value, dataType };
}

/**
 * Creates a greater than or equal filter.
 */
export function gte(field_name: string, value: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.GREATER_THAN_OR_EQUAL, field_name, value, dataType };
}

/**
 * Creates a greater than or equal filter for an attribute.
 */
export function gteAttr(attr_name: string, value: any, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.GREATER_THAN_OR_EQUAL, attr_name, value, dataType };
}

/**
 * Creates a less than filter.
 */
export function lt(field_name: string, value: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.LESS_THAN, field_name, value, dataType };
}

/**
 * Creates a less than filter for an attribute.
 */
export function ltAttr(attr_name: string, value: any, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.LESS_THAN, attr_name, value, dataType };
}

/**
 * Creates a less than or equal filter.
 */
export function lte(field_name: string, value: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.LESS_THAN_OR_EQUAL, field_name, value, dataType };
}

/**
 * Creates a less than or equal filter for an attribute.
 */
export function lteAttr(attr_name: string, value: any, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.LESS_THAN_OR_EQUAL, attr_name, value, dataType };
}

/**
 * Creates a like filter.
 */
export function like(field_name: string, value: string, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.LIKE, field_name, value, dataType };
}

/**
 * Creates a like filter for an attribute.
 */
export function likeAttr(attr_name: string, value: string, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.LIKE, attr_name, value, dataType };
}

/**
 * Creates a not like filter.
 */
export function notLike(field_name: string, value: string, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.NOT_LIKE, field_name, value, dataType };
}

/**
 * Creates a not like filter for an attribute.
 */
export function notLikeAttr(attr_name: string, value: string, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.NOT_LIKE, attr_name, value, dataType };
}

/**
 * Creates an is filter.
 */
export function is(field_name: string, value: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.IS, field_name, value, dataType };
}

/**
 * Creates an is filter for an attribute.
 */
export function isAttr(attr_name: string, value: any, dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.IS, attr_name, value, dataType };
}

/**
 * Creates an in filter.
 */
export function inFilter(field_name: string, values: any[], dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.IN, field_name, value: values, dataType };
}

/**
 * Creates an in filter for an attribute.
 */
export function inFilterAttr(attr_name: string, values: any[], dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.IN, attr_name, value: values, dataType };
}

/**
 * Creates a not in filter.
 */
export function notIn(field_name: string, values: any[], dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.NOT_IN, field_name, value: values, dataType };
}

/**
 * Creates a not in filter for an attribute.
 */
export function notInAttr(attr_name: string, values: any[], dataType?: DataType): AttrFilter {
	return { operator: FilterOperator.NOT_IN, attr_name, value: values, dataType };
}

/**
 * Creates an is null filter.
 */
export function isNull(field_name: string): FieldFilter {
	return { operator: FilterOperator.IS_NULL, field_name };
}

/**
 * Creates an is null filter for an attribute.
 */
export function isNullAttr(attr_name: string): AttrFilter {
	return { operator: FilterOperator.IS_NULL, attr_name };
}

/**
 * Creates a not null filter.
 */
export function notNull(field_name: string): FieldFilter {
	return { operator: FilterOperator.NOT_NULL, field_name };
}

/**
 * Creates a not null filter for an attribute.
 */
export function notNullAttr(attr_name: string): AttrFilter {
	return { operator: FilterOperator.NOT_NULL, attr_name };
}

/**
 * Creates a between filter.
 */
export function between(field_name: string, min: any, max: any, dataType?: DataType): FieldFilter {
	return { operator: FilterOperator.BETWEEN, field_name, value: [min, max], dataType };
}

/**
 * Creates a between filter for an attribute.
 */
export function betweenAttr(
	attr_name: string,
	min: any,
	max: any,
	dataType?: DataType
): AttrFilter {
	return { operator: FilterOperator.BETWEEN, attr_name, value: [min, max], dataType };
}

/**
 * Creates a not between filter.
 */
export function notBetween(
	field_name: string,
	min: any,
	max: any,
	dataType?: DataType
): FieldFilter {
	return { operator: FilterOperator.NOT_BETWEEN, field_name, value: [min, max], dataType };
}

/**
 * Creates a not between filter for an attribute.
 */
export function notBetweenAttr(
	attr_name: string,
	min: any,
	max: any,
	dataType?: DataType
): AttrFilter {
	return { operator: FilterOperator.NOT_BETWEEN, attr_name, value: [min, max], dataType };
}

// Backward compatibility functions
export function isFieldFilter(filter: Filter): filter is FieldFilter {
	return 'field_name' in filter;
}

export function isAttrFilter(filter: Filter): filter is AttrFilter {
	return 'attr_name' in filter;
}
