/* eslint-disable no-unused-vars */
import { createFilter } from 'vite';
import { Arrayable, ResolvedOptions } from './options';
import { normalizePath } from 'vite';
import * as fs from 'fs';
//eslint-disable-next-line node/no-missing-import
import { CompileOptions } from 'svelte/types/compiler/interfaces';
import { log } from './log';

const VITE_FS_PREFIX = '/@fs/';
const IS_WINDOWS = process.platform === 'win32';
const SUPPORTED_COMPILE_OPTIONS_IN_QUERY = [
	'generate',
	'dev',
	'css',
	'hydratable',
	'customElement',
	'immutable'
];
export type SvelteQueryTypes = 'style' | 'script' | 'preprocessed';

export interface RequestQuery {
	// our own
	svelte?: boolean;
	type?: SvelteQueryTypes;
	// vite specific
	url?: boolean;
	raw?: boolean;
	direct?: boolean;
	compileOptions?: Pick<
		CompileOptions,
		'generate' | 'dev' | 'css' | 'hydratable' | 'customElement' | 'immutable'
	>;
}

export interface SvelteRequest {
	id: string;
	cssId: string;
	filename: string;
	normalizedFilename: string;
	query: RequestQuery;
	timestamp: number;
	ssr: boolean;
	raw: boolean;
}

function splitId(id: string) {
	const parts = id.split(`?`, 2);
	const filename = parts[0];
	const rawQuery = parts[1];
	return { filename, rawQuery };
}

function parseToSvelteRequest(
	id: string,
	filename: string,
	rawQuery: string,
	root: string,
	timestamp: number,
	ssr: boolean
): SvelteRequest | undefined {
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

function createVirtualImportId(filename: string, root: string, type: SvelteQueryTypes) {
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

function parseRequestQuery(rawQuery: string): RequestQuery {
	const query = Object.fromEntries(new URLSearchParams(rawQuery));
	for (const key in query) {
		if (query[key] === '') {
			// @ts-ignore
			query[key] = true;
		}
	}
	const compileOptions = query['compileOptions'];
	if (compileOptions) {
		if (!(query.raw && query.type === 'script')) {
			throw new Error(
				`Invalid compileOptions in query ${rawQuery}. CompileOptions are only supported for raw script queries, eg '?svelte&raw&type=script&compileOptions={"generate":"ssr","dev":false}`
			);
		}
		try {
			const parsed = JSON.parse(compileOptions);
			const invalid = Object.keys(parsed).filter(
				(key) => !SUPPORTED_COMPILE_OPTIONS_IN_QUERY.includes(key)
			);
			if (invalid.length) {
				throw new Error(
					`Invalid compileOptions in query ${rawQuery}: ${invalid.join(
						', '
					)}. Supported: ${SUPPORTED_COMPILE_OPTIONS_IN_QUERY.join(', ')}`
				);
			}
			query['compileOptions'] = parsed;
		} catch (e) {
			log.error('failed to parse request query compileOptions', e);
			throw e;
		}
	}

	return query as RequestQuery;
}

/**
 * posixify and remove root at start
 *
 * @param filename
 * @param normalizedRoot
 */
function normalize(filename: string, normalizedRoot: string) {
	return stripRoot(normalizePath(filename), normalizedRoot);
}

function existsInRoot(filename: string, root: string) {
	if (filename.startsWith(VITE_FS_PREFIX)) {
		return false; // vite already tagged it as out of root
	}
	return fs.existsSync(root + filename);
}

function stripRoot(normalizedFilename: string, normalizedRoot: string) {
	return normalizedFilename.startsWith(normalizedRoot + '/')
		? normalizedFilename.slice(normalizedRoot.length)
		: normalizedFilename;
}

function buildFilter(
	include: Arrayable<string> | undefined,
	exclude: Arrayable<string> | undefined,
	extensions: string[]
): (filename: string) => boolean {
	const rollupFilter = createFilter(include, exclude);
	return (filename) => rollupFilter(filename) && extensions.some((ext) => filename.endsWith(ext));
}

export type IdParser = (id: string, ssr: boolean, timestamp?: number) => SvelteRequest | undefined;
export function buildIdParser(options: ResolvedOptions): IdParser {
	const { include, exclude, extensions, root } = options;
	const normalizedRoot = normalizePath(root);
	const filter = buildFilter(include, exclude, extensions!);
	return (id, ssr, timestamp = Date.now()) => {
		const { filename, rawQuery } = splitId(id);
		if (filter(filename)) {
			return parseToSvelteRequest(id, filename, rawQuery, normalizedRoot, timestamp, ssr);
		}
	};
}
