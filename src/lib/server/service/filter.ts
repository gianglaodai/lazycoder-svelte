/**
 * Filter model inspired by lazycoder-leptos/src/business/filter.rs
 * Provides a strongly-typed way to express filter expressions in the service layer.
 */

// Comparable scalar types (numbers and temporal)
export type ComparableScalar = number | Date | { kind: 'time'; value: string };

/**
 * ScalarValue mirrors the Rust ScalarValue variants in a TS-friendly way.
 * - string, number, boolean map directly
 * - Date maps to JS Date
 * - DateTime also maps to JS Date (with timezone baked in)
 * - Time represented as an object with ISO HH:MM:SS(.fff) in value
 */
export type ScalarValue =
	| { type: 'String'; value: string }
	| { type: 'Int'; value: number }
	| { type: 'Float'; value: number }
	| { type: 'Bool'; value: boolean }
	| { type: 'Date'; value: Date }
	| { type: 'DateTime'; value: Date }
	| { type: 'Time'; value: string };

export type ScalarType = 'Bool' | 'Int' | 'Float' | 'Date' | 'Datetime' | 'String';

export function stringVal(value: string): ScalarValue {
	return { type: 'String', value };
}
export function intVal(value: number): ScalarValue {
	return { type: 'Int', value };
}
export function floatVal(value: number): ScalarValue {
	return { type: 'Float', value };
}
export function boolVal(value: boolean): ScalarValue {
	return { type: 'Bool', value };
}
export function dateVal(value: Date): ScalarValue {
	return { type: 'Date', value };
}
export function dateTimeVal(value: Date): ScalarValue {
	return { type: 'DateTime', value };
}
/**
 * Time value should be in ISO 24h format HH:MM[:SS[.fff]]
 */
export function timeVal(value: string): ScalarValue {
	return { type: 'Time', value };
}

export type FilterValue =
	| { kind: 'Single'; value: ScalarValue }
	| { kind: 'List'; values: ScalarValue[] }
	| { kind: 'Range'; start: ScalarValue; end: ScalarValue }
	| { kind: 'None' }; // for IS NULL / NOT NULL

export enum FilterOperator {
	Equal = 'Equal',
	NotEqual = 'NotEqual',
	GreaterThan = 'GreaterThan',
	GreaterThanOrEqual = 'GreaterThanOrEqual',
	LessThan = 'LessThan',
	LessThanOrEqual = 'LessThanOrEqual',
	Like = 'Like',
	NotLike = 'NotLike',
	In = 'In',
	NotIn = 'NotIn',
	IsNull = 'IsNull',
	NotNull = 'NotNull',
	Between = 'Between',
	NotBetween = 'NotBetween'
}

export type Filter =
	| {
			kind: 'Property';
			propertyName: string;
			operator: FilterOperator;
			value: FilterValue;
	  }
	| {
			kind: 'Attribute';
			attrName: string;
			operator: FilterOperator;
			value: FilterValue;
	  }
	| {
			kind: 'Search';
			value: string;
	  };

// Helpers to check scalar category
function isNumeric(s: ScalarValue): boolean {
	return s.type === 'Int' || s.type === 'Float';
}
function isTemporal(s: ScalarValue): boolean {
	return s.type === 'Date' || s.type === 'DateTime' || s.type === 'Time';
}
function sameScalarKind(a: ScalarValue, b: ScalarValue): boolean {
	return a.type === b.type;
}

/**
 * Validate that a FilterValue is compatible with a given operator,
 * following the same semantics as the Rust implementation.
 */
export function isValueCompatible(op: FilterOperator, value: FilterValue): boolean {
	switch (op) {
		case FilterOperator.Equal:
		case FilterOperator.NotEqual:
			return value.kind === 'Single';

		case FilterOperator.GreaterThan:
		case FilterOperator.GreaterThanOrEqual:
		case FilterOperator.LessThan:
		case FilterOperator.LessThanOrEqual:
			if (value.kind !== 'Single') return false;
			return isNumeric(value.value) || isTemporal(value.value);

		case FilterOperator.Like:
		case FilterOperator.NotLike:
			return value.kind === 'Single' && value.value.type === 'String';

		case FilterOperator.In:
		case FilterOperator.NotIn: {
			if (value.kind !== 'List') return false;
			if (!value.values.length) return false;
			// allow homogeneous lists of Int, Float, or String
			const allInt = value.values.every((v) => v.type === 'Int');
			const allFloat = value.values.every((v) => v.type === 'Float');
			const allStr = value.values.every((v) => v.type === 'String');
			return allInt || allFloat || allStr;
		}

		case FilterOperator.IsNull:
		case FilterOperator.NotNull:
			return value.kind === 'None';

		case FilterOperator.Between:
		case FilterOperator.NotBetween: {
			if (value.kind !== 'Range') return false;
			const same = sameScalarKind(value.start, value.end);
			const comparable = isNumeric(value.start) || isTemporal(value.start);
			return same && comparable;
		}
	}
}

/**
 * Convenience validator for a full Filter.
 */
export function validateFilter(filter: Filter): boolean {
	switch (filter.kind) {
		case 'Property':
		case 'Attribute':
			return isValueCompatible(filter.operator, filter.value);
		case 'Search':
			return typeof filter.value === 'string';
	}
}

// Factory helpers
export const filter = {
	property(propertyName: string, operator: FilterOperator, value: FilterValue): Filter {
		return { kind: 'Property', propertyName, operator, value };
	},
	attribute(attrName: string, operator: FilterOperator, value: FilterValue): Filter {
		return { kind: 'Attribute', attrName, operator, value };
	},
	search(value: string): Filter {
		return { kind: 'Search', value };
	}
};
