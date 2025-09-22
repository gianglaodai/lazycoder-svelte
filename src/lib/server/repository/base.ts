import type { Entity } from '$lib/server/service/base';
import { and, eq, inArray, asc, desc, SQL, getTableColumns } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getCurrentDb } from '$lib/server/db';
import { Transactional } from '$lib/server/service/transaction';
import type { Sort } from '$lib/server/service/sort';
import { SortDirection } from '$lib/server/service/sort';
import { attributes } from '$lib/server/db/schema/attributes';

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
export type ScalarType = 'Bool' | 'Int' | 'Float' | 'Date' | 'Datetime' | 'String';

export interface Repository<T extends Entity, C extends CreateFor<T>> {
	findById(id: number): Promise<T | null>;
	findByIds(ids: number[]): Promise<T[]>;
	findByUid(uid: string): Promise<T | null>;
	findByUids(uids: string[]): Promise<T[]>;
	findMany(sorts: Sort[]): Promise<T[]>;
	exist(id: number): Promise<boolean>;

	insert(input: C): Promise<T>;
	update(input: T): Promise<T>;

	deleteById(id: number): Promise<number>;
	deleteByIds(ids: number[]): Promise<number>;
	deleteByUid(uid: string): Promise<number>;
	deleteByUids(uids: string[]): Promise<number>;

	// New metadata methods inspired by lazycoder-leptos service.rs
	getTableName(): string;
	getColumnTypeMap(): Promise<Record<string, ScalarType>>;
	getAttributeTypeMap?(): Promise<Record<string, ScalarType>>;
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
	protected readonly columns: Record<string, any>;
	protected readonly tableName: string;

	constructor(args: {
		table: any;
		toEntity: (row: any) => T;
		mapCreate: (input: C) => Record<string, any>;
		mapUpdate: (input: T) => Record<string, any>;
		tableName?: string;
	}) {
		this.table = args.table;
		this.toEntity = args.toEntity;
		this.mapCreate = args.mapCreate;
		this.mapUpdate = args.mapUpdate;
		this.columns = getTableColumns(args.table);
		this.tableName = args.tableName ?? (args.table?.["_" + "name"] ?? args.table?.name ?? 'unknown');
	}

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
			.select({ id: this.table.idCol })
			.from(this.table)
			.where(eq(this.table.idCol, id))
			.limit(1);
		return row.length > 0;
	}

	@Transactional
	async findById(id: number): Promise<T | null> {
		const rows = await this.getDb()
			.select()
			.from(this.table)
			.where(eq(this.table.idCol, id))
			.limit(1);
		return rows[0] ? this.toEntity(rows[0]) : null;
	}

	@Transactional
	async findByIds(ids: number[]): Promise<T[]> {
		if (!ids.length) return [];
		const rows = await this.getDb().select().from(this.table).where(inArray(this.table.idCol, ids));
		return rows.map(this.toEntity);
	}

	@Transactional
	async findByUid(uid: string): Promise<T | null> {
		const rows = await this.getDb()
			.select()
			.from(this.table)
			.where(eq(this.table.uidCol, uid))
			.limit(1);
		return rows[0] ? this.toEntity(rows[0]) : null;
	}

	@Transactional
	async findByUids(uids: string[]): Promise<T[]> {
		if (!uids.length) return [];
		const rows = await this.getDb()
			.select()
			.from(this.table)
			.where(inArray(this.table.uidCol, uids));
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
			.where(and(eq(this.table.idCol, entity.id), eq(this.table.versionCol, entity.version)))
			.returning();

		return this.toEntity(result[0]);
	}

	@Transactional
	async deleteById(id: number): Promise<number> {
		await this.beforeDelete({ by: 'id', value: id });
		const rows = await this.getDb()
			.delete(this.table)
			.where(eq(this.table.idCol, id))
			.returning({ id: this.table.idCol });
		return rows.length;
	}

	@Transactional
	async deleteByIds(ids: number[]): Promise<number> {
		if (!ids.length) return 0;
		await this.beforeDelete({ by: 'ids', value: ids });
		const rows = await this.getDb()
			.delete(this.table)
			.where(inArray(this.table.idCol, ids))
			.returning({ id: this.table.idCol });
		return rows.length;
	}

	@Transactional
	async deleteByUid(uid: string): Promise<number> {
		await this.beforeDelete({ by: 'uid', value: uid });
		const rows = await this.getDb()
			.delete(this.table)
			.where(eq(this.table.uidCol, uid))
			.returning({ id: this.table.idCol });
		return rows.length;
	}

	@Transactional
	async deleteByUids(uids: string[]): Promise<number> {
		if (!uids.length) return 0;
		await this.beforeDelete({ by: 'uids', value: uids });
		const rows = await this.getDb()
			.delete(this.table)
			.where(inArray(this.table.uidCol, uids))
			.returning({ id: this.table.idCol });
		return rows.length;
	}

	protected getColumnMap(): Record<string, any> {
		return this.columns;
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
	async findMany(sorts: Sort[] = []): Promise<T[]> {
		let query: any = this.getDb().select().from(this.table);

		// Apply sorting if any
		if (sorts.length > 0) {
			const orderClauses = sorts.map((sort) => this.toOrder(sort));
			query = query.orderBy(...orderClauses);
		}

		const rows = await query;
		return rows.map(this.toEntity);
	}

	getTableName(): string {
		return this.tableName;
	}

	async getColumnTypeMap(): Promise<Record<string, ScalarType>> {
		const result: Record<string, ScalarType> = {};
		const cols = this.getColumnMap();
		for (const [key, col] of Object.entries(cols)) {
			result[key] = this.#inferScalarType(col, key);
		}
		return result;
	}

	// EAV attribute map: read from attributes table for this entity type
	async getAttributeTypeMap(): Promise<Record<string, ScalarType>> {
		// We look up attributes where entity_type = this repository's table name
		const db = this.getDb();
		// Lazy import to avoid circular deps at module init
		const rows = await db
			.select({ name: (attributes as any).name, dataType: (attributes as any).dataType })
			.from(attributes as any)
			.where(eq((attributes as any).entityType, this.tableName));
		const out: Record<string, ScalarType> = {};
		for (const r of rows as Array<{ name: string; dataType: string }>) {
			out[r.name] = this.#mapAttributeType(r.dataType);
		}
		return out;
	}

	#inferScalarType(col: any, key: string): ScalarType {
		const dt = (col?.dataType ?? col?._?.dataType ?? col?._?.type ?? col?.sqlName ?? '').toString();
		const lower = dt.toLowerCase();
		if (lower.includes('bool')) return 'Bool';
		if (lower.includes('int') || lower.includes('serial')) return 'Int';
		if (lower.includes('real') || lower.includes('double') || lower.includes('float') || lower.includes('numeric') || lower.includes('decimal')) return 'Float';
		if (lower.includes('timestamp') || lower.includes('timestamptz')) return 'Datetime';
		if (lower.includes('date') && !lower.includes('timestamp')) return 'Date';
		// Heuristics
		if (key === 'id' || key === 'version') return 'Int';
		if (key === 'createdAt' || key === 'updatedAt') return 'Datetime';
		if (key === 'uid') return 'String';
		return 'String';
	}

	#mapAttributeType(typeStr: string): ScalarType {
		const lower = (typeStr ?? '').toString().toLowerCase();
		if (lower.includes('bool')) return 'Bool';
		if (lower === 'int' || lower === 'integer' || lower.includes('int')) return 'Int';
		if (
			lower === 'float' ||
			lower === 'double' ||
			lower === 'real' ||
			lower.includes('numeric') ||
			lower.includes('decimal')
		)
			return 'Float';
		if (lower === 'datetime' || lower.includes('timestamp') || lower.includes('timestamptz')) return 'Datetime';
		if (lower === 'date') return 'Date';
		return 'String';
	}
}
