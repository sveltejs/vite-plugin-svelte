import { ResolvedOptions } from './options';
import fs from 'fs';
import { toRollupError } from './error';
import { log } from './log';
import type { SvelteRequest } from './id';
import { type CompileData, CompileSvelte } from './compile';

/**
 * utility function to compile ?raw and ?direct requests in load hook
 */
export async function loadRaw(
	svelteRequest: SvelteRequest,
	compileSvelte: CompileSvelte,
	options: ResolvedOptions
) {
	const { id, filename, query } = svelteRequest;

	// raw svelte subrequest, compile on the fly and return requested subpart
	let compileData;
	const source = fs.readFileSync(filename, 'utf-8');
	try {
		//avoid compileSvelte doing extra ssr stuff unless requested
		svelteRequest.ssr = query.compilerOptions?.generate === 'ssr';
		const type = query.type;
		compileData = await compileSvelte(svelteRequest, source, {
			...options,
			// don't use dynamic vite-plugin-svelte defaults here to ensure stable result between ssr,dev and build
			compilerOptions: {
				dev: false,
				css: false,
				hydratable: false,
				enableSourcemap: query.sourcemap
					? {
							js: type === 'script' || type === 'all',
							css: type === 'style' || type === 'all'
					  }
					: false,
				...svelteRequest.query.compilerOptions
			},
			hot: false,
			emitCss: true
		});
	} catch (e) {
		throw toRollupError(e, options);
	}
	let result;
	if (query.type === 'style') {
		result = compileData.compiled.css;
	} else if (query.type === 'script') {
		result = compileData.compiled.js;
	} else if (query.type === 'preprocessed') {
		result = compileData.preprocessed;
	} else if (query.type === 'all' && query.raw) {
		return allToRawExports(compileData, source);
	} else {
		throw new Error(
			`invalid "type=${query.type}" in ${id}. supported are script, style, preprocessed, all`
		);
	}
	if (query.direct) {
		const supportedDirectTypes = ['script', 'style'];
		if (!supportedDirectTypes.includes(query.type)) {
			throw new Error(
				`invalid "type=${
					query.type
				}" combined with direct in ${id}. supported are: ${supportedDirectTypes.join(', ')}`
			);
		}
		log.debug(`load returns direct result for ${id}`);
		let directOutput = result.code;
		if (query.sourcemap && result.map?.toUrl) {
			const map = `sourceMappingURL=${result.map.toUrl()}`;
			if (query.type === 'style') {
				directOutput += `\n\n/*# ${map} */\n`;
			} else if (query.type === 'script') {
				directOutput += `\n\n//# ${map}\n`;
			}
		}
		return directOutput;
	} else if (query.raw) {
		log.debug(`load returns raw result for ${id}`);
		return toRawExports(result);
	} else {
		throw new Error(`invalid raw mode in ${id}, supported are raw, direct`);
	}
}

function allToRawExports(compileData: CompileData, source: string) {
	// flatten CompileData
	const exports: Partial<CompileData & { source: string }> = {
		...compileData,
		...compileData.compiled,
		source
	};
	delete exports.compiled;
	delete exports.filename; // absolute path, remove to avoid it in output
	return toRawExports(exports);
}

function toRawExports(object: object) {
	let exports =
		Object.entries(object)
			//eslint-disable-next-line no-unused-vars
			.filter(([key, value]) => typeof value !== 'function') // preprocess output has a toString function that's enumerable
			.map(([key, value]) => `export const ${key}=${JSON.stringify(value)}`)
			.join('\n') + '\n';
	if (Object.prototype.hasOwnProperty.call(object, 'code')) {
		exports += `export default code\n`;
	}
	return exports;
}
