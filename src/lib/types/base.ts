// Shared base interfaces for core object shapes across layers
// - TransferObject: controller boundary shape (dates as ISO strings)
// - ObjectRelationMapper: ORM row shape (dates as Date)

export type TransferObject = object;

// Utility type to assert relationships at compile time (no runtime cost)
export type AssertExtends<T extends U, U> = true;
