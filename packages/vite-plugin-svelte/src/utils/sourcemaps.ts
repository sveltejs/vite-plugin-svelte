import path from 'path';

interface SourceMapFileRefs {
	file?: string;
	sources?: string[];
}
/**
 * sourcemap file references are relative to the sourcemap itself
 * assume the sourcemap location is the same as filename and turn absolute paths to relative
 * to avoid leaking fs information like vite root
 */
export function mapToRelative(map: SourceMapFileRefs | undefined, filename: string) {
	if (!map) {
		return;
	}
	const basename = path.basename(filename);
	if (map.file === filename) {
		map.file = basename;
	}
	if (map.sources) {
		map.sources = map.sources.map((s) => {
			if (path.isAbsolute(s)) {
				const relative = path.relative(filename, s);
				// empty string as a source is not allowed, use simple filename
				return relative === '' ? basename : relative;
			} else {
				return s;
			}
		});
	}
}

/**
 * vitePreprocess uses an extra lang extension to tell vite about the type of preprocessor to use
 * This function removes it afterwards to get back working file refs
 *
 * map is modified in place.
 *
 * @param map the output sourcemap
 * @param filename original filename passed to vite
 * @param lang added lang extension
 */
export function removeLangSuffix(
	map: SourceMapFileRefs | undefined,
	filename: string,
	lang: string
) {
	if (!map) {
		return;
	}
	const basename = path.basename(filename);
	const suffixed = `${basename}.${lang}`;
	const removeSuffix = (s: string) =>
		s.endsWith(suffixed) ? s.slice(0, -1 * (lang.length + 1)) : s;
	if (map.file) {
		map.file = removeSuffix(map.file);
	}
	if (map.sources) {
		map.sources = map.sources.map(removeSuffix);
	}
}
