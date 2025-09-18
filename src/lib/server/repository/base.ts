import type { Entity } from '$lib/server/service/base';
import {
	and,
	eq,
	inArray,
	gt,
	gte,
	lt,
	lte,
	isNull,
	isNotNull,
	ne,
	notInArray,
	between,
	notBetween,
	ilike,
	notIlike,
	asc,
	desc,
	SQL
} from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getCurrentDb } from '$lib/server/db';
import { Transactional } from '$lib/server/service/transaction';
import type { Filter } from '$lib/server/service/filter';
import { FilterOperator, isFieldFilter, isAttrFilter } from '$lib/server/service/filter';
import type { Sort } from '$lib/server/service/sort';
import { SortDirection } from '$lib/server/service/sort';

export interface ObjectRelationMapper {
	id: number;
	uid: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Marker interface for create input types
 */
export interface CreateFor<T extends Entity> {
	/** Marker property — do not set or use at runtime */
	readonly __createFor__?: (x: T) => void;
}

/**
 * Repository contract for data access layer used by services.
 * Defines the minimal operations expected from any repository.
 */
export interface Repository<T extends Entity, C extends CreateFor<T>> {
	findById(id: number): Promise<T | null>;
	findByIds(ids: number[]): Promise<T[]>;
	findByUid(uid: string): Promise<T | null>;
	findByUids(uids: string[]): Promise<T[]>;
	findMany(filters?: any[], sorts?: any[]): Promise<T[]>;
	exist(id: number): Promise<boolean>;

	insert(input: C): Promise<T>;
	update(input: T): Promise<T>;

	deleteById(id: number): Promise<number>;
	deleteByIds(ids: number[]): Promise<number>;
	deleteByUid(uid: string): Promise<number>;
	deleteByUids(uids: string[]): Promise<number>;
}

/**
 * Base implementation of the Repository interface using Drizzle ORM.
 * All methods automatically use transactions.
 */
export class BaseDrizzleRepository<T extends Entity, C extends CreateFor<T>>
	implements Repository<T, C>
{
	protected readonly table: any;
	protected readonly toEntity: (row: any) => T;
	protected readonly mapCreate: (input: C) => Record<string, any>;
	protected readonly mapUpdate: (input: T) => Record<string, any>;

	// Column references from the table (e.g., table.id, table.uid, ...)
	protected readonly idCol: any;
	protected readonly uidCol: any;
	protected readonly versionCol: any;
	protected readonly updatedAtCol: any;

	constructor(args: {
		table: any;
		toEntity: (row: any) => T;
		mapCreate: (input: C) => Record<string, any>;
		mapUpdate: (input: T) => Record<string, any>;
		idCol: any;
		uidCol: any;
		versionCol: any;
		updatedAtCol: any;
	}) {
		this.table = args.table;
		this.toEntity = args.toEntity;
		this.mapCreate = args.mapCreate;
		this.mapUpdate = args.mapUpdate;
		this.idCol = args.idCol;
		this.uidCol = args.uidCol;
		this.versionCol = args.versionCol;
		this.updatedAtCol = args.updatedAtCol;
	}

	/**
	 * Gets the current database instance, which could be a transaction
	 * if called within a transaction context, or the default db instance otherwise.
	 */
	protected getDb() {
		return getCurrentDb();
	}

	protected async beforeCreate(input: C): Promise<any> {
		const now = new Date();
		return {
			...this.mapCreate(input),
			uid: uuidv7(),
			version: 0,
			createdAt: now,
			updatedAt: now
		};
	}

	protected async beforeUpdate(input: T): Promise<any> {
		return {
			...this.mapUpdate(input),
			version: input.version + 1,
			updatedAt: new Date()
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async beforeDelete(_ctx: {
		by: 'id' | 'ids' | 'uid' | 'uids';
		value: number | number[] | string | string[];
	}): Promise<void> {
		// no-op by default
	}

	@Transactional
	async exist(id: number): Promise<boolean> {
		const row = await this.getDb()
			.select({ id: this.idCol })
			.from(this.table)
			.where(eq(this.idCol, id))
			.limit(1);
		return row.length > 0;
	}

	@Transactional
	async findById(id: number): Promise<T | null> {
		const rows = await this.getDb().select().from(this.table).where(eq(this.idCol, id)).limit(1);
		return rows[0] ? this.toEntity(rows[0]) : null;
	}

	@Transactional
	async findByIds(ids: number[]): Promise<T[]> {
		if (!ids.length) return [];
		const rows = await this.getDb().select().from(this.table).where(inArray(this.idCol, ids));
		return rows.map(this.toEntity);
	}

	@Transactional
	async findByUid(uid: string): Promise<T | null> {
		const rows = await this.getDb().select().from(this.table).where(eq(this.uidCol, uid)).limit(1);
		return rows[0] ? this.toEntity(rows[0]) : null;
	}

	@Transactional
	async findByUids(uids: string[]): Promise<T[]> {
		if (!uids.length) return [];
		const rows = await this.getDb().select().from(this.table).where(inArray(this.uidCol, uids));
		return rows.map(this.toEntity);
	}

	@Transactional
	async insert(input: C): Promise<T> {
		const createEntity = await this.beforeCreate(input);
		const result = (await this.getDb()
			.insert(this.table)
			.values(createEntity)
			.returning()) as any[];
		return this.toEntity(result[0]);
	}

	@Transactional
	async update(entity: T): Promise<T> {
		const updateEntity = await this.beforeUpdate(entity);

		// Use a single where clause with AND to avoid TypeScript errors
		const db = this.getDb() as any;
		const result = await db
			.update(this.table)
			.set(updateEntity)
			.where(and(eq(this.idCol, entity.id), eq(this.versionCol, entity.version)))
			.returning();

		return this.toEntity(result[0]);
	}

	@Transactional
	async deleteById(id: number): Promise<number> {
		await this.beforeDelete({ by: 'id', value: id });
		const rows = await this.getDb()
			.delete(this.table)
			.where(eq(this.idCol, id))
			.returning({ id: this.idCol });
		return rows.length;
	}

	@Transactional
	async deleteByIds(ids: number[]): Promise<number> {
		if (!ids.length) return 0;
		await this.beforeDelete({ by: 'ids', value: ids });
		const rows = await this.getDb()
			.delete(this.table)
			.where(inArray(this.idCol, ids))
			.returning({ id: this.idCol });
		return rows.length;
	}

	@Transactional
	async deleteByUid(uid: string): Promise<number> {
		await this.beforeDelete({ by: 'uid', value: uid });
		const rows = await this.getDb()
			.delete(this.table)
			.where(eq(this.uidCol, uid))
			.returning({ id: this.idCol });
		return rows.length;
	}

	@Transactional
	async deleteByUids(uids: string[]): Promise<number> {
		if (!uids.length) return 0;
		await this.beforeDelete({ by: 'uids', value: uids });
		const rows = await this.getDb()
			.delete(this.table)
			.where(inArray(this.uidCol, uids))
			.returning({ id: this.idCol });
		return rows.length;
	}

	/**
	 * Creates a column map for use with filters and sorters.
	 * Override this method in derived repositories to provide a mapping
	 * from field names to column references.
	 */
	protected getColumnMap(): Record<string, any> {
		return {
			id: this.idCol,
			uid: this.uidCol,
			version: this.versionCol,
			updatedAt: this.updatedAtCol
		};
	}

	/**
	 * Converts a Filter to a Drizzle ORM condition.
	 *
	 * @param filter The filter to convert
	 * @returns A Drizzle ORM condition
	 */
	protected toCondition(filter: Filter): SQL {
		let column: any;

		if (isFieldFilter(filter)) {
			column = this.getColumnMap()[filter.field_name];
			if (!column) {
				throw new Error(`Unknown field: ${filter.field_name}`);
			}
		} else if (isAttrFilter(filter)) {
			throw new Error('EAV model not fully implemented in BaseDrizzleRepository');
		} else {
			throw new Error('Invalid filter type');
		}

		switch (filter.operator) {
			case FilterOperator.EQUAL:
				return eq(column, filter.value);
			case FilterOperator.NOT_EQUAL:
				return ne(column, filter.value);
			case FilterOperator.GREATER_THAN:
				return gt(column, filter.value);
			case FilterOperator.GREATER_THAN_OR_EQUAL:
				return gte(column, filter.value);
			case FilterOperator.LESS_THAN:
				return lt(column, filter.value);
			case FilterOperator.LESS_THAN_OR_EQUAL:
				return lte(column, filter.value);
			case FilterOperator.LIKE:
				return ilike(column, `%${filter.value}%`);
			case FilterOperator.NOT_LIKE:
				return notIlike(column, `%${filter.value}%`);
			case FilterOperator.IS:
				return eq(column, filter.value);
			case FilterOperator.IN:
				return inArray(column, filter.value);
			case FilterOperator.NOT_IN:
				return notInArray(column, filter.value);
			case FilterOperator.IS_NULL:
				return isNull(column);
			case FilterOperator.NOT_NULL:
				return isNotNull(column);
			case FilterOperator.BETWEEN:
				if (!Array.isArray(filter.value) || filter.value.length !== 2) {
					throw new Error('BETWEEN operator requires an array of two values');
				}
				return between(column, filter.value[0], filter.value[1]);
			case FilterOperator.NOT_BETWEEN:
				if (!Array.isArray(filter.value) || filter.value.length !== 2) {
					throw new Error('NOT_BETWEEN operator requires an array of two values');
				}
				return notBetween(column, filter.value[0], filter.value[1]);
			default:
				throw new Error(`Unsupported filter operator: ${filter.operator}`);
		}
	}

	/**
	 * Converts a Sort to a Drizzle ORM order.
	 *
	 * @param sort The sort to convert
	 * @returns A Drizzle ORM order
	 */
	protected toOrder(sort: Sort): SQL {
		let column: any;

		// Check if the sort has field_name or attr_name
		if ('field_name' in sort) {
			column = this.getColumnMap()[sort.field_name];
			if (!column) {
				throw new Error(`Unknown field: ${sort.field_name}`);
			}
		} else if ('attr_name' in sort) {
			throw new Error('EAV model not fully implemented in BaseDrizzleRepository');
		} else {
			throw new Error('Invalid sort type');
		}

		switch (sort.direction) {
			case SortDirection.ASC:
				return asc(column);
			case SortDirection.DESC:
				return desc(column);
			default:
				throw new Error(`Unsupported sort direction: ${sort.direction}`);
		}
	}

	@Transactional
	async findMany(filters: Filter[] = [], sorts: Sort[] = []): Promise<T[]> {
		let query: any = this.getDb().select().from(this.table);

		// Apply filters if any
		if (filters.length > 0) {
			const conditions = filters.map((filter) => this.toCondition(filter));
			query = query.where(and(...conditions));
		}

		// Apply sorting if any
		if (sorts.length > 0) {
			const orderClauses = sorts.map((sort) => this.toOrder(sort));
			query = query.orderBy(...orderClauses);
		}

		const rows = await query;
		return rows.map(this.toEntity);
	}
}
