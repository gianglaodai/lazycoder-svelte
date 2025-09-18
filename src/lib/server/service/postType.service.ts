import { postTypeRepository } from '../repository/postType.repository';

import type { CreateFor, Entity } from '$lib/server/service/base';
import { BaseService, Transactional } from '$lib/server/service/base';
import { BadRequestError, ConflictError } from '$lib/server/service/error';

export interface PostType extends Entity {
	code: string;
	name: string;
}

export type PostTypeCreate = { code: string; name: string } & CreateFor<PostType>;

function validateCode(code: string) {
	const re = /^[a-z0-9]+([a-z0-9_-]*[a-z0-9])?$/;
	if (!re.test(code)) throw new BadRequestError('Invalid code format');
}

class PostTypeService extends BaseService<PostType, PostTypeCreate> {
	constructor() {
		super(postTypeRepository);
	}

	@Transactional
	async create(input: PostTypeCreate): Promise<PostType> {
		validateCode(input.code);
		const existing = await postTypeRepository.getByCode(input.code);
		if (existing) throw new ConflictError('error.postType.code.exists');
		return super.create(input);
	}

	@Transactional
	async update(id: number, input: PostType): Promise<PostType> {
		if (input.code !== undefined) {
			validateCode(input.code);
			const existing = await postTypeRepository.getByCode(input.code);
			if (existing && existing.id !== id) throw new ConflictError('error.postType.code.exists');
		}
		return await super.update(id, input);
	}

	@Transactional
	async getByCode(code: string): Promise<PostType | null> {
		return postTypeRepository.getByCode(code);
	}
}

export const postTypeService = new PostTypeService();