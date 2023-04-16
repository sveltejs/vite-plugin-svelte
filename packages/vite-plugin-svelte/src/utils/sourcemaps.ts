import path from 'path';

interface SourceMapFileRefs {
	file?: string;
	sources?: string[];
	sourceRoot?: string;
}
/**
 * convert absolute paths in sourcemap file refs to their relative equivalents to avoid leaking fs info
 *
 *
 */
export function mapToRelative(map: SourceMapFileRefs | undefined, filename: string) {
	if (!map) {
		return;
	}
	const dirname = path.dirname(filename);
	const toRelative = (s: string) => {
		let sourcePath = s.startsWith('file://') ? s.slice(7) : s;
		if (map.sourceRoot) {
			sourcePath = path.resolve(map.sourceRoot, sourcePath);
		}
		if (path.isAbsolute(sourcePath)) {
			return path.relative(dirname, sourcePath);
		}
		return s;
	};
	if (map.file) {
		map.file = path.basename(filename);
	}
	if (map.sources) {
		map.sources = map.sources.map(toRelative);
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
