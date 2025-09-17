// Test file to verify Orm type exports
import {
	PostOrm,
	UserOrm,
	SessionOrm,
	KeyOrm,
	PostTypeOrm,
	PostCollectionOrm,
	PostTaxonomyOrm,
	TermOrm,
	PostCollectionItemOrm,
	PostTermOrm,
	PostRelationOrm,
	AttributeOrm,
	AttributeValueOrm
} from './schema';

// Function that demonstrates using the Orm types
function processOrmData() {
	// Example function that would process a post
	function processPost(post: PostOrm) {
		console.log(`Processing post: ${post.title} (${post.status})`);
		return post;
	}

	// Example function that would process a user
	function processUser(user: UserOrm) {
		console.log(`Processing user: ${user.username} (${user.role})`);
		return user;
	}

	// Example function that would process a session
	function processSession(session: SessionOrm) {
		console.log(`Processing session for user: ${session.userId}`);
		return session;
	}

	// Example function that would process multiple Orm types
	function processData(data: {
		posts?: PostOrm[];
		users?: UserOrm[];
		postTypes?: PostTypeOrm[];
		terms?: TermOrm[];
		attributes?: AttributeOrm[];
	}) {
		if (data.posts) {
			data.posts.forEach(processPost);
		}

		if (data.users) {
			data.users.forEach(processUser);
		}

		return data;
	}

	console.log('All Orm types imported and used successfully');

	return {
		processPost,
		processUser,
		processSession,
		processData
	};
}

// Export the test function
export { processOrmData };
