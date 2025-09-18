import type { CreateFor, Entity, Repository } from '$lib/server/service/base';
import { eq, inArray } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

export interface ObjectRelationMapper {
	id: number;
	uid: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
}

export class BaseDrizzleRepository<T extends Entity, C extends CreateFor<T>>
	implements Repository<T, C>
{
	protected readonly db: any;
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
		db: any;
		table: any;
		toEntity: (row: any) => T;
		mapCreate: (input: C) => Record<string, any>;
		mapUpdate: (input: T) => Record<string, any>;
		idCol: any;
		uidCol: any;
		versionCol: any;
		updatedAtCol: any;
	}) {
		this.db = args.db;
		this.table = args.table;
		this.toEntity = args.toEntity;
		this.mapCreate = args.mapCreate;
		this.mapUpdate = args.mapUpdate;
		this.idCol = args.idCol;
		this.uidCol = args.uidCol;
		this.versionCol = args.versionCol;
		this.updatedAtCol = args.updatedAtCol;
	}

	protected async beforeCreate(input: C): Promise<C> {
		const now = new Date();
		return { ...input, uid: uuidv7(), version: 0, createdAt: now, updatedAt: now };
	}

	protected async beforeUpdate(input: T): Promise<T> {
		return {...input, version: input.version + 1, updatedAt: new Date()};
	}

	protected async beforeDelete(_ctx: { by: 'id' | 'ids' | 'uid' | 'uids'; value: number | number[] | string | string[] }): Promise<void> {
		// no-op by default
	}

	async exist(id: number): Promise<boolean> {
		const row = await this.db.select({ id: this.idCol }).from(this.table).where(eq(this.idCol, id)).limit(1);
		return row.length > 0;
	}

	async findById(id: number): Promise<T | null> {
		const rows = await this.db.select().from(this.table).where(eq(this.idCol, id)).limit(1);
		return rows[0] ? this.toEntity(rows[0]) : null;
	}

	async findByIds(ids: number[]): Promise<T[]> {
		if (!ids.length) return [];
		const rows = await this.db.select().from(this.table).where(inArray(this.idCol, ids));
		return rows.map(this.toEntity);
	}

	async findByUid(uid: string): Promise<T | null> {
		const rows = await this.db.select().from(this.table).where(eq(this.uidCol, uid)).limit(1);
		return rows[0] ? this.toEntity(rows[0]) : null;
	}

	async findByUids(uids: string[]): Promise<T[]> {
		if (!uids.length) return [];
		const rows = await this.db.select().from(this.table).where(inArray(this.uidCol, uids));
		return rows.map(this.toEntity);
	}

	async insert(input: C): Promise<T> {
		const createEntity = await this.beforeCreate(input);
		const [row] = await this.db.insert(this.table).values(createEntity).returning();
		return this.toEntity(row);
	}

	async update(input: T): Promise<T> {
		const updateEntity = await this.beforeUpdate(input);

		const [row] = await this.db
			.update(this.table)
			.set(updateEntity)
			.where(eq(this.idCol, updateEntity.id))
			.returning();
		return this.toEntity(row);
	}

	async deleteById(id: number): Promise<number> {
		await this.beforeDelete({ by: 'id', value: id });
		const rows = await this.db.delete(this.table).where(eq(this.idCol, id)).returning({ id: this.idCol });
		return rows.length;
	}

	async deleteByIds(ids: number[]): Promise<number> {
		if (!ids.length) return 0;
		await this.beforeDelete({ by: 'ids', value: ids });
		const rows = await this.db
			.delete(this.table)
			.where(inArray(this.idCol, ids))
			.returning({ id: this.idCol });
		return rows.length;
	}

	async deleteByUid(uid: string): Promise<number> {
		await this.beforeDelete({ by: 'uid', value: uid });
		const rows = await this.db
			.delete(this.table)
			.where(eq(this.uidCol, uid))
			.returning({ id: this.idCol });
		return rows.length;
	}

	async deleteByUids(uids: string[]): Promise<number> {
		if (!uids.length) return 0;
		await this.beforeDelete({ by: 'uids', value: uids });
		const rows = await this.db
			.delete(this.table)
			.where(inArray(this.uidCol, uids))
			.returning({ id: this.idCol });
		return rows.length;
	}
}
