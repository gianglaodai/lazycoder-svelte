// Simple in-memory cache utilities inspired by lazycoder-leptos cache.rs
// Global, process-local cache with string namespaces and combined keys

// Namespaces (service names)
export const FIELD_TYPE_MAP = 'FIELD_TYPE_MAP';
export const ATTRIBUTE_TYPE_MAP = 'ATTRIBUTE_TYPE_MAP';

// Single global cache map storing arbitrary values
const CACHE = new Map<string, unknown>();

function makeKey(serviceName: string, key: string): string {
	return `${serviceName}:${key}`;
}

// Async get-or-compute; errors from loader propagate to caller
export async function getOrCompute<V>(
	serviceName: string,
	key: string,
	loader: () => Promise<V>
): Promise<V> {
	const k = makeKey(serviceName, key);
	if (CACHE.has(k)) {
		return CACHE.get(k) as V;
	}
	const value = await loader();
	CACHE.set(k, value as unknown);
	return value;
}

// Synchronous update/insert using a supplier function
export function update<V>(serviceName: string, key: string, make: () => V): void {
	const k = makeKey(serviceName, key);
	const value = make();
	CACHE.set(k, value as unknown);
}
