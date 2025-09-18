import { postTypeService } from '$lib/server/service/postType.service';
import type { PostType, PostTypeCreate } from '$lib/server/service/postType.service';

/**
 * Example of using the new transaction-first implementation
 * 
 * This file demonstrates how the new implementation automatically uses transactions
 * for all operations without requiring explicit transaction handling.
 */

/**
 * Create a new post type
 * 
 * This operation automatically runs in a transaction.
 */
export async function createPostType(data: PostTypeCreate): Promise<PostType> {
  // The create method automatically uses a transaction
  return postTypeService.create(data);
}

/**
 * Update a post type
 * 
 * This operation automatically runs in a transaction.
 */
export async function updatePostType(id: number, data: PostType): Promise<PostType> {
  // The update method automatically uses a transaction
  return postTypeService.update(id, data);
}

/**
 * Create multiple post types
 * 
 * This operation automatically runs in a single transaction.
 * If any post type creation fails, all will be rolled back.
 */
export async function createMultiplePostTypes(postTypes: PostTypeCreate[]): Promise<PostType[]> {
  const results: PostType[] = [];
  
  // The entire function runs in a single transaction because of the @Transactional decorator
  for (const postTypeData of postTypes) {
    const postType = await postTypeService.create(postTypeData);
    results.push(postType);
  }
  
  return results;
}

/**
 * Update a post type and create a related post type
 * 
 * This operation automatically runs in a single transaction.
 * If any operation fails, all will be rolled back.
 */
export async function updateAndCreateRelatedPostType(
  id: number, 
  updateData: PostType,
  relatedPostType: PostTypeCreate
): Promise<{ updated: PostType, related: PostType }> {
  // The entire function runs in a single transaction because of the @Transactional decorator
  
  // Update the existing post type
  const updated = await postTypeService.update(id, updateData);
  
  // Create a related post type
  const related = await postTypeService.create(relatedPostType);
  
  return { updated, related };
}

/**
 * Complex operation with multiple steps
 * 
 * This operation automatically runs in a single transaction.
 * If any step fails, all will be rolled back.
 */
export async function complexOperation(
  id: number,
  newName: string,
  newCode: string,
  relatedPostTypes: PostTypeCreate[]
): Promise<{
  updated: PostType,
  related: PostType[]
}> {
  // The entire function runs in a single transaction because of the @Transactional decorator
  
  // Get the current post type
  const postType = await postTypeService.getById(id);
  
  // Update the post type with the new name and code
  const updated = await postTypeService.update(id, {
    ...postType,
    name: newName,
    code: newCode
  });
  
  // Create related post types
  const related: PostType[] = [];
  for (const relatedData of relatedPostTypes) {
    const relatedPostType = await postTypeService.create(relatedData);
    related.push(relatedPostType);
  }
  
  return { updated, related };
}

/**
 * Using the built-in updateMultiple method
 * 
 * This operation automatically runs in a single transaction.
 */
export async function updateMultiplePostTypes(updates: Array<{id: number, data: PostType}>): Promise<PostType[]> {
  // The updateMultiple method automatically uses a transaction
  return postTypeService.updateMultiple(updates);
}

/**
 * Using the built-in createWithRelatedOperations method
 * 
 * This operation automatically runs in a single transaction.
 */
export async function createPostTypeWithRelatedOperations(
  data: PostTypeCreate,
  relatedPostTypes: PostTypeCreate[]
): Promise<{
  main: PostType,
  related: PostType[]
}> {
  const related: PostType[] = [];
  
  // The createWithRelatedOperations method automatically uses a transaction
  const main = await postTypeService.createWithRelatedOperations(
    data,
    async (entity) => {
      // Create related post types
      for (const relatedData of relatedPostTypes) {
        const relatedPostType = await postTypeService.create({
          ...relatedData,
          name: `${relatedData.name} (related to ${entity.name})`
        });
        related.push(relatedPostType);
      }
    }
  );
  
  return { main, related };
}