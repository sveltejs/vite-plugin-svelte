import { normalizePath } from 'vite';
import fs from 'node:fs';
import process from 'node:process';
import { log } from './log.js';
import {
	DEFAULT_SVELTE_EXT,
	DEFAULT_SVELTE_MODULE_EXT,
	DEFAULT_SVELTE_MODULE_INFIX,
	SVELTE_VIRTUAL_STYLE_ID_REGEX
} from './constants.js';
import { arraify } from './options.js';

const VITE_FS_PREFIX = '/@fs/';
const IS_WINDOWS = process.platform === 'win32';

const SUPPORTED_COMPILER_OPTIONS = ['generate', 'dev', 'css', 'customElement', 'immutable'];
const TYPES_WITH_COMPILER_OPTIONS = ['style', 'script', 'all'];

/**
 * @param {string} id
 * @returns {{ filename: string, rawQuery: string }}
 */
function splitId(id) {
	const parts = id.split('?', 2);
	const filename = parts[0];
	const rawQuery = parts[1];
	return { filename, rawQuery };
}

/**
 * @param {string} id
 * @param {string} filename
 * @param {string} rawQuery
 * @param {string} root
 * @param {number} timestamp
 * @param {boolean} ssr
 * @returns {import('../types/id.d.ts').SvelteRequest | undefined}
 */
function parseToSvelteRequest(id, filename, rawQuery, root, timestamp, ssr) {
	const query = parseRequestQuery(rawQuery);
	const rawOrDirect = !!(query.raw || query.direct);
	if (query.url || (!query.svelte && rawOrDirect)) {
		// skip requests with special vite tags
		return;
	}
	const raw = rawOrDirect;
	const normalizedFilename = normalize(filename, root);
	const cssId = createVirtualImportId(filename, root, 'style');

	return {
		id,
		filename,
		normalizedFilename,
		cssId,
		query,
		timestamp,
		ssr,
		raw
	};
}

/**
 * @param {string} filename
 * @param {string} root
 * @param {import('../types/id.d.ts').SvelteQueryTypes} type
 * @returns {string}
 */
function createVirtualImportId(filename, root, type) {
	const parts = ['svelte', `type=${type}`];
	if (type === 'style') {
		parts.push('lang.css');
	}
	if (existsInRoot(filename, root)) {
		filename = root + filename;
	} else if (filename.startsWith(VITE_FS_PREFIX)) {
		filename = IS_WINDOWS
			? filename.slice(VITE_FS_PREFIX.length) // remove /@fs/ from /@fs/C:/...
			: filename.slice(VITE_FS_PREFIX.length - 1); // remove /@fs from /@fs/home/user
	}
	// return same virtual id format as vite-plugin-vue eg ...App.svelte?svelte&type=style&lang.css
	return `${filename}?${parts.join('&')}`;
}

/**
 * @param {string} rawQuery
 * @returns {import('../types/id.d.ts').RequestQuery}
 */
function parseRequestQuery(rawQuery) {
	const query = Object.fromEntries(new URLSearchParams(rawQuery));
	for (const key in query) {
		if (query[key] === '') {
			// @ts-expect-error not boolean
			query[key] = true;
		}
	}
	const compilerOptions = query.compilerOptions;
	if (compilerOptions) {
		if (!((query.raw || query.direct) && TYPES_WITH_COMPILER_OPTIONS.includes(query.type))) {
			throw new Error(
				`Invalid compilerOptions in query ${rawQuery}. CompilerOptions are only supported for raw or direct queries with type in "${TYPES_WITH_COMPILER_OPTIONS.join(
					', '
				)}" e.g. '?svelte&raw&type=script&compilerOptions={"generate":"server","dev":false}`
			);
		}
		try {
			const parsed = JSON.parse(compilerOptions);
			const invalid = Object.keys(parsed).filter(
				(key) => !SUPPORTED_COMPILER_OPTIONS.includes(key)
			);
			if (invalid.length) {
				throw new Error(
					`Invalid compilerOptions in query ${rawQuery}: ${invalid.join(
						', '
					)}. Supported: ${SUPPORTED_COMPILER_OPTIONS.join(', ')}`
				);
			}
			query.compilerOptions = parsed;
		} catch (e) {
			log.error('failed to parse request query compilerOptions', e);
			throw e;
		}
	}

	return /** @type {import('../types/id.d.ts').RequestQuery}*/ query;
}

/**
 * posixify and remove root at start
 *
 * @param {string} filename
 * @param {string} normalizedRoot
 * @returns {string}
 */
export function normalize(filename, normalizedRoot) {
	return stripRoot(normalizePath(filename), normalizedRoot);
}

/**
 * @param {string} filename
 * @param {string} root
 * @returns {boolean}
 */
function existsInRoot(filename, root) {
	if (filename.startsWith(VITE_FS_PREFIX)) {
		return false; // vite already tagged it as out of root
	}
	return fs.existsSync(root + filename);
}

/**
 * @param {string} normalizedFilename
 * @param {string} normalizedRoot
 * @returns {string}
 */
function stripRoot(normalizedFilename, normalizedRoot) {
	return normalizedFilename.startsWith(normalizedRoot + '/')
		? normalizedFilename.slice(normalizedRoot.length)
		: normalizedFilename;
}

/**
 *
 * @param {string} s
 * @returns {string}
 */
function escapeRE(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {import('../types/id.d.ts').IdFilter}
 */
export function buildIdFilter(options) {
	const { include = [], exclude = [], extensions = DEFAULT_SVELTE_EXT } = options;
	// this regex combines configured extensions and looks for them at the end of the string or directly before first ? or #
	const extensionsRE = new RegExp(
		`^[^?#]+\\.(?:${extensions
			.map((e) => (e.startsWith('.') ? e.slice(1) : e))
			.map(escapeRE)
			.join('|')})(?:[?#]|$)`
	);
	return {
		id: {
			include: [extensionsRE, .../**@type {Array<string|RegExp>}*/ arraify(include)],
			exclude: /**@type {Array<string|RegExp>}*/ [
				SVELTE_VIRTUAL_STYLE_ID_REGEX, // exclude from regular pipeline, we load it in a separate plugin
				...arraify(exclude)
			]
		}
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {import('../types/id.d.ts').IdParser}
 */
export function buildIdParser(options) {
	const normalizedRoot = normalizePath(options.root);
	return (id, ssr, timestamp = Date.now()) => {
		const { filename, rawQuery } = splitId(id);
		return parseToSvelteRequest(id, filename, rawQuery, normalizedRoot, timestamp, ssr);
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {import('../types/id.d.ts').IdFilter}
 */
export function buildModuleIdFilter(options) {
	const {
		infixes = DEFAULT_SVELTE_MODULE_INFIX,
		include = [],
		exclude = [],
		extensions = DEFAULT_SVELTE_MODULE_EXT
	} = options.experimental?.compileModule ?? {};
	// this regex combines configured infixes and extensions
	// and looks for them at the end of the string or directly before first ? or #
	const infixWithExtRE = new RegExp(
		`^[^?#]+(?:${infixes.map(escapeRE).join('|')})(?:[^.\\\\/]+\\.)*(?:${extensions
			.map((e) => (e.startsWith('.') ? e.slice(1) : e))
			.map(escapeRE)
			.join('|')})(?:[?#]|$)`
	);
	return {
		id: {
			include: [infixWithExtRE, .../**@type {Array<string|RegExp>}*/ arraify(include)],
			exclude: /**@type {Array<string|RegExp>}*/ arraify(exclude)
		}
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {import('../types/id.d.ts').ModuleIdParser}
 */
export function buildModuleIdParser(options) {
	const root = options.root;
	const normalizedRoot = normalizePath(root);
	return (id, ssr, timestamp = Date.now()) => {
		const { filename, rawQuery } = splitId(id);
		return parseToSvelteModuleRequest(id, filename, rawQuery, normalizedRoot, timestamp, ssr);
	};
}

/**
 * @param {string} id
 * @param {string} filename
 * @param {string} rawQuery
 * @param {string} root
 * @param {number} timestamp
 * @param {boolean} ssr
 * @returns {import('../types/id.d.ts').SvelteModuleRequest | undefined}
 */
function parseToSvelteModuleRequest(id, filename, rawQuery, root, timestamp, ssr) {
	const query = parseRequestQuery(rawQuery);

	if (query.url || query.raw || query.direct) {
		// skip requests with special vite tags
		return;
	}

	const normalizedFilename = normalize(filename, root);

	return {
		id,
		filename,
		normalizedFilename,
		query,
		timestamp,
		ssr
	};
}
