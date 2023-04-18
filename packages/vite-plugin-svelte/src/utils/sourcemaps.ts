import path from 'path';
import { fileURLToPath } from 'url';
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
		let sourcePath: string;
		let isAbsolute: boolean;
		if (s.startsWith('file:///')) {
			sourcePath = fileURLToPath(s);
			if (IS_WINDOWS) {
				sourcePath = sourcePath.replace(/\\/g, '/'); // ensure forward slashed paths on win
			}
			isAbsolute = true; // file urls are always absolute
		} else {
			sourcePath = map.sourceRoot
				? `${map.sourceRoot}${map.sourceRoot.endsWith('/') || s.startsWith('/') ? '' : '/'}${s}`
				: s;
			isAbsolute = path.isAbsolute(sourcePath);
		}
		return isAbsolute ? path.relative(dirname, sourcePath) : sourcePath;
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
	const removeSuffix = (s: string) => (s.endsWith(suffix) ? s.slice(0, -1 * suffix.length) : s);
	if (map.file) {
		map.file = removeSuffix(map.file);
	}
	if (map.sources) {
		map.sources = map.sources.map(removeSuffix);
	}
}
