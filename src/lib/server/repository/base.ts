import type { CreateFor, Entity, Repository } from '$lib/server/service/base';

export interface ObjectRelationMapper {
	id: number;
	uid: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
}
/**
 * Abstract base class that implements the Repository interface shape while
 * allowing concrete repositories to implement the actual persistence.
 */
export abstract class AbstractRepository<T extends Entity, C extends CreateFor<T>>
	implements Repository<T, C>
{
	abstract exist(id: number): Promise<boolean>;
	abstract findById(id: number): Promise<T | null>;
	abstract findByIds(ids: number[]): Promise<T[]>;
	abstract findByUid(uid: string): Promise<T | null>;
	abstract findByUids(uids: string[]): Promise<T[]>;

	abstract insert(input: C): Promise<T>;
	abstract update(input: T): Promise<T>;

	abstract deleteById(id: number): Promise<number>;
	abstract deleteByIds(ids: number[]): Promise<number>;
	abstract deleteByUid(uid: string): Promise<number>;
	abstract deleteByUids(uids: string[]): Promise<number>;
}
