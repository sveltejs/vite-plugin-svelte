import path from 'path';
const IS_WINDOWS = process.platform === 'win32';
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
		//remove leading file:// and extra / from file:///C://path on windows
		let sourcePath = s.startsWith('file:///') ? s.slice(IS_WINDOWS ? 8 : 7) : s;
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
 * @param suffix the suffix to remove
 */
export function removeLangSuffix(map: SourceMapFileRefs | undefined, suffix: string) {
	if (!map) {
		return;
	}
	const removeSuffix = (s: string) => (s.endsWith(suffix) ? s.slice(0, -1 * suffix.length) : s);
	if (map.file) {
		map.file = removeSuffix(map.file);
	}
	if (map.sources) {
		map.sources = map.sources.map(removeSuffix);
	}
}
