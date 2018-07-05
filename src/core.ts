
export function createMapFromTemplate<T>(template: Record<string, T>): Map<string, T> {
	const map = new Map<string, T>();
	// Copies keys/values from template. Note that for..in will not throw if
	// template is undefined, and instead will just exit the loop.
	for (const key in template) {
		if (template.hasOwnProperty(key)) {
			map.set(key, template[key]);
		}
	}
	return map;
}
