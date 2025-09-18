import { ConflictError, NotFoundError } from '$lib/server/service/error';
import type { CreateFor, Repository } from '$lib/server/repository/base';
import { Transactional } from '$lib/server/service/transaction';
import type { Filter } from '$lib/server/service/filter';
import type { Sort } from '$lib/server/service/sort';
export type { CreateFor };

export interface Entity {
	id: number;
	uid: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
}

// Create the Transactional decorator using the transaction manager

export class BaseService<T extends Entity, C extends CreateFor<T>> {
	protected readonly repo: Repository<T, C>;

	constructor(repo: Repository<T, C>) {
		this.repo = repo;
	}

	@Transactional
	async getById(id: number): Promise<T> {
		const item = await this.repo.findById(id);
		if (!item) throw new NotFoundError();
		return item;
	}

	@Transactional
	async getByIds(ids: number[]): Promise<T[]> {
		return this.repo.findByIds(ids);
	}

	@Transactional
	async getByUid(uid: string): Promise<T> {
		const item = await this.repo.findByUid(uid);
		if (!item) throw new NotFoundError();
		return item;
	}

	@Transactional
	async getByUids(uids: string[]): Promise<T[]> {
		return this.repo.findByUids(uids);
	}

	@Transactional
	async create(input: C): Promise<T> {
		return this.repo.insert(input);
	}

	@Transactional
	async update(id: number, input: T): Promise<T> {
		const entity = await this.repo.findById(id);
		if (!entity) throw new NotFoundError();
		if (entity.version !== input.version) throw new ConflictError();
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id: inputId, uid, version, createdAt, updatedAt, ...rest } = input;
		return await this.repo.update({ ...entity, ...rest });
	}

	@Transactional
	async deleteById(id: number): Promise<number> {
		return await this.repo.deleteById(id);
	}

	@Transactional
	async deleteByIds(ids: number[]): Promise<number> {
		return this.repo.deleteByIds(ids);
	}

	@Transactional
	async deleteByUid(uid: string): Promise<number> {
		return await this.repo.deleteByUid(uid);
	}

	@Transactional
	async deleteByUids(uids: string[]): Promise<number> {
		return this.repo.deleteByUids(uids);
	}

	@Transactional
	async updateMultiple(updates: Array<{ id: number; data: T }>): Promise<T[]> {
		const results: T[] = [];

		for (const update of updates) {
			results.push(await this.update(update.id, update.data));
		}

		return results;
	}

	@Transactional
	async createWithRelatedOperations(
		input: C,
		relatedOperation: (entity: T) => Promise<void>
	): Promise<T> {
		const entity = await this.create(input);
		await relatedOperation(entity);
		return entity;
	}

	/**
	 * Gets entities based on the provided filters and sorts.
	 *
	 * @param filters Optional list of filters to apply
	 * @param sorts Optional list of sorts to apply
	 * @returns List of entities matching the filters, ordered by the sorts
	 */
	@Transactional
	async getMany(filters: Filter[] = [], sorts: Sort[] = []): Promise<T[]> {
		return this.repo.findMany(filters, sorts);
	}
}
