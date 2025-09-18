import { postTypeRepository } from '../repository/postType.repository';

// Business Object
import type { Entity } from '$lib/server/service/base';
import { BadRequestError, ConflictError, NotFoundError } from '$lib/server/service/error';

export interface PostType extends Entity {
	code: string;
	name: string;
}

function validateCode(code: string) {
	const re = /^[a-z0-9]+([a-z0-9_-]*[a-z0-9])?$/;
	if (!re.test(code)) throw new BadRequestError('Invalid code format');
}

export const postTypeService = {
	async list(limit?: number, offset?: number): Promise<PostType[]> {
		return postTypeRepository.list(limit, offset);
	},

	async get(id: number): Promise<PostType> {
		const pt = await postTypeRepository.getById(id);
		if (!pt) throw new NotFoundError('Not found');
		return pt;
	},

	async create(input: { uid: string; code: string; name: string }): Promise<PostType> {
		validateCode(input.code);
		// uniqueness by code
		const existing = await postTypeRepository.getByCode(input.code);
		if (existing) throw new ConflictError('Code already exists');
		return postTypeRepository.create(input);
	},

	async update(
		id: number,
		input: { code?: string; name?: string; expectedVersion: number }
	): Promise<PostType> {
		if (input.code !== undefined) {
			validateCode(input.code);
			const existing = await postTypeRepository.getByCode(input.code);
			if (existing && existing.id !== id) throw new ConflictError('Code already exists');
		}
		// Ensure it exists first to distinguish 404 vs version conflict
		const current = await postTypeRepository.getById(id);
		if (!current) throw new NotFoundError('Not found');

		const updated = await postTypeRepository.update(id, input);
		if (!updated) throw new ConflictError('Version conflict');
		return updated;
	},

	async delete(id: number): Promise<void> {
		const ok = await postTypeRepository.delete(id);
		if (!ok) throw new NotFoundError('Not found');
	}
};
