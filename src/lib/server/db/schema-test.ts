// Import all tables from schema
import {
  attributes,
  attributeValues,
  users,
  postTypes,
  posts,
  postCollections,
  postTaxonomies,
  terms,
  postCollectionItems,
  postTerms,
  postRelations
} from './schema/index';

// This is just a test file to verify that the schema imports work correctly
// It's not meant to be executed, just to check TypeScript compilation

// Reference each table to ensure they're properly imported
const tables = {
  attributes,
  attributeValues,
  users,
  postTypes,
  posts,
  postCollections,
  postTaxonomies,
  terms,
  postCollectionItems,
  postTerms,
  postRelations
};

export default tables;