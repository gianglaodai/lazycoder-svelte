import { test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { postTypeRepository } from './postType.repository';
import { testDb, withTestTransaction, closeTestDb } from '../db/test-db';
import { postTypes } from '../db/schema/postTypes';
import type { PostType, PostTypeCreate } from '../service/postType.service';
import { ascSort, descSort } from '../service/sort';

// Test fixtures
const testPostTypes: PostTypeCreate[] = [
	{
		code: 'blog',
		name: 'Blog Post'
	},
	{
		code: 'news',
		name: 'News Article'
	},
	{
		code: 'tutorial',
		name: 'Tutorial'
	}
];

// Setup and teardown
beforeAll(async () => {
	// Start Docker container if not already running
	console.log('Setting up test database...');

	// Create schema if needed
	await testDb.execute(`
    CREATE TABLE IF NOT EXISTS post_types (
      id SERIAL PRIMARY KEY,
      uid UUID NOT NULL UNIQUE,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );
  `);
});

afterAll(async () => {
	// Clean up and close connection
	await testDb.delete(postTypes);
	await closeTestDb();
});

beforeEach(async () => {
	// Clean up before each test
	await testDb.delete(postTypes);
});

afterEach(async () => {
	// Clean up after each test
	await testDb.delete(postTypes);
});

// Helper function to override the database used by the repository
const originalGetDb = postTypeRepository.getDb;
function setupTestDb() {
	// Override the getDb method to use the test database
	postTypeRepository.getDb = () => testDb;

	return () => {
		// Restore the original getDb method
		postTypeRepository.getDb = originalGetDb;
	};
}

// Tests
test('insert should create a new post type', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const postType = await postTypeRepository.insert(testPostTypes[0]);

			expect(postType).toBeDefined();
			expect(postType.code).toBe(testPostTypes[0].code);
			expect(postType.name).toBe(testPostTypes[0].name);
			expect(postType.id).toBeGreaterThan(0);
			expect(postType.uid).toBeDefined();
			expect(postType.version).toBe(1);
			expect(postType.createdAt).toBeInstanceOf(Date);
			expect(postType.updatedAt).toBeInstanceOf(Date);
		});
	} finally {
		cleanup();
	}
});

test('findById should return a post type by id', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const inserted = await postTypeRepository.insert(testPostTypes[0]);
			const found = await postTypeRepository.findById(inserted.id);

			expect(found).toBeDefined();
			expect(found?.id).toBe(inserted.id);
			expect(found?.code).toBe(testPostTypes[0].code);
		});
	} finally {
		cleanup();
	}
});

test('findByUid should return a post type by uid', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const inserted = await postTypeRepository.insert(testPostTypes[0]);
			const found = await postTypeRepository.findByUid(inserted.uid);

			expect(found).toBeDefined();
			expect(found?.uid).toBe(inserted.uid);
			expect(found?.code).toBe(testPostTypes[0].code);
		});
	} finally {
		cleanup();
	}
});

test('getByCode should return a post type by code', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			await postTypeRepository.insert(testPostTypes[0]);
			const found = await postTypeRepository.getByCode(testPostTypes[0].code);

			expect(found).toBeDefined();
			expect(found?.code).toBe(testPostTypes[0].code);
			expect(found?.name).toBe(testPostTypes[0].name);
		});
	} finally {
		cleanup();
	}
});

test('update should modify an existing post type', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const inserted = await postTypeRepository.insert(testPostTypes[0]);

			const updatedEntity: PostType = {
				...inserted,
				name: 'Updated Blog Post'
			};

			const updated = await postTypeRepository.update(updatedEntity);

			expect(updated).toBeDefined();
			expect(updated.id).toBe(inserted.id);
			expect(updated.name).toBe('Updated Blog Post');
			expect(updated.version).toBe(2);
			expect(updated.updatedAt.getTime()).toBeGreaterThan(inserted.updatedAt.getTime());
		});
	} finally {
		cleanup();
	}
});

test('deleteById should remove a post type', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const inserted = await postTypeRepository.insert(testPostTypes[0]);
			const deleteCount = await postTypeRepository.deleteById(inserted.id);

			expect(deleteCount).toBe(1);

			const found = await postTypeRepository.findById(inserted.id);
			expect(found).toBeNull();
		});
	} finally {
		cleanup();
	}
});

test('findByIds should return multiple post types', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const inserted1 = await postTypeRepository.insert(testPostTypes[0]);
			const inserted2 = await postTypeRepository.insert(testPostTypes[1]);

			const found = await postTypeRepository.findByIds([inserted1.id, inserted2.id]);

			expect(found).toHaveLength(2);
			expect(found.map((pt) => pt.code).sort()).toEqual(
				[testPostTypes[0].code, testPostTypes[1].code].sort()
			);
		});
	} finally {
		cleanup();
	}
});

test('findByUids should return multiple post types', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const inserted1 = await postTypeRepository.insert(testPostTypes[0]);
			const inserted2 = await postTypeRepository.insert(testPostTypes[1]);

			const found = await postTypeRepository.findByUids([inserted1.uid, inserted2.uid]);

			expect(found).toHaveLength(2);
			expect(found.map((pt) => pt.code).sort()).toEqual(
				[testPostTypes[0].code, testPostTypes[1].code].sort()
			);
		});
	} finally {
		cleanup();
	}
});

test('exist should return true for existing post type', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const inserted = await postTypeRepository.insert(testPostTypes[0]);
			const exists = await postTypeRepository.exist(inserted.id);

			expect(exists).toBe(true);
		});
	} finally {
		cleanup();
	}
});

test('exist should return false for non-existing post type', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			const exists = await postTypeRepository.exist(999999);

			expect(exists).toBe(false);
		});
	} finally {
		cleanup();
	}
});

	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			// Insert all test post types
			await Promise.all(testPostTypes.map((pt) => postTypeRepository.insert(pt)));

			// Filter by exact code match
			const found = await postTypeRepository.findMany([eq('code', 'blog')]);

			expect(found).toHaveLength(1);
			expect(found[0].code).toBe('blog');
			expect(found[0].name).toBe('Blog Post');
		});
	} finally {
		cleanup();
	}
});

test('findMany should filter post types by partial match', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			// Insert all test post types
			await Promise.all(testPostTypes.map((pt) => postTypeRepository.insert(pt)));

			// Filter by partial name match
			const found = await postTypeRepository.findMany([like('name', 'Post')]);

			expect(found).toHaveLength(1);
			expect(found[0].code).toBe('blog');
			expect(found[0].name).toBe('Blog Post');
		});
	} finally {
		cleanup();
	}
});

test('findMany should sort post types', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			// Insert all test post types
			await Promise.all(testPostTypes.map((pt) => postTypeRepository.insert(pt)));

			// Sort by name ascending
			const ascSorted = await postTypeRepository.findMany([], [ascSort('name')]);
			expect(ascSorted.map((pt) => pt.name)).toEqual(
				[...testPostTypes.map((pt) => pt.name)].sort()
			);

			// Sort by name descending
			const descSorted = await postTypeRepository.findMany([], [descSort('name')]);
			expect(descSorted.map((pt) => pt.name)).toEqual(
				[...testPostTypes.map((pt) => pt.name)].sort().reverse()
			);
		});
	} finally {
		cleanup();
	}
});

test('findMany should filter and sort post types', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			// Insert all test post types
			await Promise.all(testPostTypes.map((pt) => postTypeRepository.insert(pt)));

			// Add one more post type with similar name
			await postTypeRepository.insert({
				code: 'article',
				name: 'Article Post'
			});

			// Filter by partial name match and sort by code
			const found = await postTypeRepository.findMany([like('name', 'Post')], [ascSort('code')]);

			expect(found).toHaveLength(2);
			expect(found[0].code).toBe('article'); // 'article' comes before 'blog' alphabetically
			expect(found[1].code).toBe('blog');
		});
	} finally {
		cleanup();
	}
});
