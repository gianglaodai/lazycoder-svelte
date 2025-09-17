import { db } from '.';
import { users } from './schema/index';

// This is just a test file to verify that the schema imports work correctly
// It's not meant to be executed, just to check TypeScript compilation

async function testSchema() {
  // Test that we can reference the schema objects
  const result = await db.select().from(users);
  console.log(result);
  
  return result;
}

export default testSchema;