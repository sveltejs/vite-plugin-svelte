import { ResolvedOptions } from './options';
import fs from 'fs';
import { toRollupError } from './error';
import { log } from './log';
import type { SvelteRequest } from './id';
import { CompileSvelte } from './compile';

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
	try {
		//avoid compileSvelte doing extra ssr stuff unless requested
		svelteRequest.ssr = svelteRequest.query.compilerOptions?.generate === 'ssr';

		compileData = await compileSvelte(svelteRequest, fs.readFileSync(filename, 'utf-8'), {
			...options,
			// don't use dynamic vite-plugin-svelte defaults here to ensure stable result between ssr,dev and build
			compilerOptions: {
				dev: false,
				css: false,
				hydratable: false,
				enableSourcemap: svelteRequest.query.sourcemap
					? {
							js: svelteRequest.query.type === 'script',
							css: svelteRequest.query.type === 'style'
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
	} else {
		throw new Error(
			`invalid "type=${query.type}" in ${svelteRequest.id}. supported are script, style, preprocessed`
		);
	}
	if (query.direct) {
		const supportedDirectTypes = ['script', 'style'];
		if (!supportedDirectTypes.includes(query.type)) {
			throw new Error(
				`invalid "type=${query.type}" combined with direct in ${
					svelteRequest.id
				}. supported are: ${supportedDirectTypes.join(', ')}`
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
		return toDefaultExport(result);
	} else {
		throw new Error(`invalid raw mode in ${svelteRequest.id}, supported are raw, direct`);
	}
}

function toDefaultExport(object: object | string) {
	return `export default ${JSON.stringify(object)}`;
}
