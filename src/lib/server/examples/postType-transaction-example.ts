import { postTypeService } from '$lib/server/service/postType.service';
import type { PostType, PostTypeCreate } from '$lib/server/service/postType.service';

/**
 * Example of using transactions with PostTypeService
 * 
 * This file demonstrates how to use the transaction support with the existing PostTypeService.
 */

/**
 * Creates multiple post types in a single transaction
 * If any post type creation fails, all will be rolled back
 */
export async function createMultiplePostTypes(postTypes: PostTypeCreate[]): Promise<PostType[]> {
  return postTypeService.withTransaction(async txService => {
    const results: PostType[] = [];
    
    for (const postTypeData of postTypes) {
      // Each creation happens within the same transaction
      const postType = await txService.create(postTypeData);
      results.push(postType);
    }
    
    return results;
  });
}

/**
 * Updates a post type and creates a related post type in a single transaction
 */
export async function updateAndCreateRelatedPostType(
  id: number, 
  updateData: PostType,
  relatedPostType: PostTypeCreate
): Promise<{ updated: PostType, related: PostType }> {
  return postTypeService.withTransaction(async txService => {
    // Update the existing post type
    const updated = await txService.update(id, updateData);
    
    // Create a related post type
    const related = await txService.create(relatedPostType);
    
    return { updated, related };
  });
}

/**
 * Renames a post type and updates all related entities in a single transaction
 * 
 * This is a more complex example that would involve multiple services
 */
export async function renamePostTypeWithRelatedEntities(
  id: number,
  newName: string,
  // In a real application, you would inject other services here
): Promise<PostType> {
  return postTypeService.withTransaction(async txService => {
    // Get the current post type
    const postType = await txService.getById(id);
    
    // Update the post type with the new name
    const updated = await txService.update(id, {
      ...postType,
      name: newName
    });
    
    // In a real application, you would update related entities here
    // For example:
    // const txPostService = await postService.withTransaction(s => Promise.resolve(s));
    // await txPostService.updatePostsForPostType(id, { postTypeName: newName });
    
    return updated;
  });
}

/**
 * Using the pre-built transaction methods
 */
export async function usingPrebuiltTransactionMethods() {
  // Example 1: Update with transaction
  const updatedPostType = await postTypeService.updateWithTransaction(1, {
    id: 1,
    uid: 'existing-uid',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    code: 'updated-code',
    name: 'Updated Name'
  });
  
  // Example 2: Update multiple entities
  const updatedPostTypes = await postTypeService.updateMultipleEntities([
    {
      id: 1,
      data: {
        id: 1,
        uid: 'existing-uid-1',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        code: 'updated-code-1',
        name: 'Updated Name 1'
      }
    },
    {
      id: 2,
      data: {
        id: 2,
        uid: 'existing-uid-2',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        code: 'updated-code-2',
        name: 'Updated Name 2'
      }
    }
  ]);
  
  // Example 3: Create with related operations
  const newPostType = await postTypeService.createWithRelatedOperations(
    {
      code: 'new-code',
      name: 'New Post Type'
    } as PostTypeCreate,
    async (entity) => {
      // Perform related operations here
      console.log(`Created post type with ID: ${entity.id}`);
      // In a real application, you would perform related operations here
    }
  );
  
  return {
    updatedPostType,
    updatedPostTypes,
    newPostType
  };
}