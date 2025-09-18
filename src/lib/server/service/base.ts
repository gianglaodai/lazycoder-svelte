import { NotFoundError } from '$lib/server/service/error';

export interface Entity {
	id: number;
	uid: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateFor<T extends Entity> {
	/** Marker property — do not set or use at runtime */
	readonly __createFor__?: (x: T) => void;
}

/**
 * Generic abstract base class for Services (Business Logic layer).
 *
 * T = Business Object (Entity) type returned by the service
 * C = Create input type accepted by create(), constrained only by marker to relate to T
 */
export class BaseService<T extends Entity, C extends CreateFor<T>> {
	protected readonly repo: Repository<T, C>;

	constructor(repo: Repository<T, C>) {
		this.repo = repo;
	}

	// Reads
	async getById(id: number): Promise<T> {
		const item = await this.repo.findById(id);
		if (!item) throw new NotFoundError('Not found');
		return item;
	}

	async getByIds(ids: number[]): Promise<T[]> {
		return this.repo.findByIds(ids);
	}

	async getByUid(uid: string): Promise<T> {
		const item = await this.repo.findByUid(uid);
		if (!item) throw new NotFoundError('Not found');
		return item;
	}

	async getByUids(uids: string[]): Promise<T[]> {
		return this.repo.findByUids(uids);
	}

	async create(input: C): Promise<T> {
		return this.repo.insert(input);
	}

	async update(id: number, input: T): Promise<T> {
		const exists = await this.repo.exist(id);
		if (!exists) throw new NotFoundError('Not found');
		(input as T).id = id;
		return await this.repo.update(input);
	}

	async deleteById(id: number): Promise<number> {
		return await this.repo.deleteById(id);
	}

	async deleteByIds(ids: number[]): Promise<number> {
		return this.repo.deleteByIds(ids);
	}

	async deleteByUid(uid: string): Promise<number> {
		return await this.repo.deleteByUid(uid);
	}

	async deleteByUids(uids: string[]): Promise<number> {
		return this.repo.deleteByUids(uids);
	}
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
	exist(id: number): Promise<boolean>;

	insert(input: C): Promise<T>;
	update(input: T): Promise<T>;

	deleteById(id: number): Promise<number>;
	deleteByIds(ids: number[]): Promise<number>;
	deleteByUid(uid: string): Promise<number>;
	deleteByUids(uids: string[]): Promise<number>;
}
