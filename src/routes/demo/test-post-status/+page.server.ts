import { db } from '$lib/server/db';
import { posts, postStatusEnum } from '$lib/server/db/schema/posts';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get all posts with their statuses
	const allPosts = await db.query.posts.findMany({
		columns: {
			id: true,
			title: true,
			slug: true,
			status: true
		},
		limit: 10,
		orderBy: sql`id desc`
	});

	// Count posts by status
	const statusCounts = await db
		.select({
			status: posts.status,
			count: sql<number>`count(*)::int`
		})
		.from(posts)
		.groupBy(posts.status);

	return {
		posts: allPosts,
		statusValues: postStatusEnum.enumValues,
		statusCounts
	};
};
