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
 * map is modified in place.
 *
 * @param map sourcemap
 * @param filename absolute path to file the sourcemap is for
 */
export function mapToRelative(map: SourceMapFileRefs | undefined, filename: string) {
	if (!map) {
		return;
	}
	const sourceRoot = map.sourceRoot;
	const dirname = path.dirname(filename);
	const toRelative = (s: string) => {
		if (!s) {
			return s;
		}
		let sourcePath: string;
		if (s.startsWith('file:///')) {
			// windows has file:///C:/foo and posix has file:///foo, so we have to remove one extra on windows
			sourcePath = s.slice(IS_WINDOWS ? 8 : 7);
		} else if (sourceRoot) {
			const sep = sourceRoot[sourceRoot.length - 1] === '/' || s[0] === '/' ? '' : '/';
			sourcePath = `${sourceRoot}${sep}${s}`;
		} else {
			sourcePath = s;
		}
		return path.isAbsolute(sourcePath) ? path.relative(dirname, sourcePath) : sourcePath;
	};

	if (map.file) {
		map.file = path.basename(filename);
	}
	if (map.sources) {
		map.sources = map.sources.map(toRelative);
	}
	if (map.sourceRoot) {
		// we have prepended sourceRoot and computed relative paths from it
		// remove it here to avoid downstream processing prepending it again
		delete map.sourceRoot;
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
	const removeSuffix = (s: string) => (s?.endsWith(suffix) ? s.slice(0, -1 * suffix.length) : s);
	if (map.file) {
		map.file = removeSuffix(map.file);
	}
	if (map.sources) {
		map.sources = map.sources.map(removeSuffix);
	}
}
