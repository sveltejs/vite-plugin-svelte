import path from 'path';

/**
 * sourcemap sources are relative to the sourcemap itself
 * assume the sourcemap location is the same as filename and turn absolute paths to relative
 * to avoid leaking fs information like vite root
 */
export function mapSourcesToRelative(map: { sources?: string[] }, filename: string) {
	if (map?.sources) {
		map.sources = map.sources.map((s) => {
			if (path.isAbsolute(s)) {
				const relative = path.relative(filename, s);
				// empty string as a source is not allowed, use simple filename
				return relative === '' ? path.basename(filename) : relative;
			} else {
				return s;
			}
		});
	}
}
