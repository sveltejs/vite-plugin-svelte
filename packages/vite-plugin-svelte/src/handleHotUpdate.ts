import { ModuleNode, HmrContext } from 'vite';
import { CompileData } from './utils/compile';
import { log } from './utils/log';
import { SvelteRequest } from './utils/id';
import { VitePluginSvelteCache } from './utils/VitePluginSvelteCache';

/**
 * Vite-specific HMR handling
 */
export async function handleHotUpdate(
	compileSvelte: Function,
	ctx: HmrContext,
	svelteRequest: SvelteRequest,
	cache: VitePluginSvelteCache
): Promise<ModuleNode[] | void> {
	const { read, server } = ctx;
	const cachedCompileData = cache.getCompileData(svelteRequest, false);
	if (!cachedCompileData) {
		// file hasn't been requested yet (e.g. async component)
		log.debug(`handleHotUpdate first call ${svelteRequest.id}`);
		return;
	}

	const content = await read();
	const compileData: CompileData = await compileSvelte(
		svelteRequest,
		content,
		cachedCompileData.options
	);
	cache.setCompileData(compileData);

	const affectedModules = new Set<ModuleNode | undefined>();

	const cssModule = server.moduleGraph.getModuleById(svelteRequest.cssId);
	const mainModule = server.moduleGraph.getModuleById(svelteRequest.id);
	if (cssModule && cssChanged(cachedCompileData, compileData)) {
		log.debug('handleHotUpdate css changed');
		affectedModules.add(cssModule);
	}

	if (mainModule && jsChanged(cachedCompileData, compileData)) {
		log.debug('handleHotUpdate js changed');
		affectedModules.add(mainModule);
	}

	const result = [...affectedModules].filter(Boolean) as ModuleNode[];
	log.debug(`handleHotUpdate result for ${svelteRequest.id}`, result);

	// TODO is this enough? see also: https://github.com/vitejs/vite/issues/2274
	const ssrModulesToInvalidate = result.filter((m) => !!m.ssrTransformResult);
	if (ssrModulesToInvalidate.length > 0) {
		log.debug(`invalidating modules ${ssrModulesToInvalidate.map((m) => m.id).join(', ')}`);
		ssrModulesToInvalidate.forEach((moduleNode) => server.moduleGraph.invalidateModule(moduleNode));
	}

	return result;
}

function cssChanged(prev: CompileData, next: CompileData): boolean {
	return !isCodeEqual(prev.compiled.css?.code, next.compiled.css?.code);
}

function jsChanged(prev: CompileData, next: CompileData): boolean {
	const prevJs = prev.compiled.js.code;
	const nextJs = next.compiled.js.code;
	const isStrictEqual = isCodeEqual(prevJs, nextJs);
	if (isStrictEqual) {
		return false;
	}
	const isLooseEqual = isCodeEqual(normalizeJsCode(prevJs), normalizeJsCode(nextJs));
	if (!isStrictEqual && isLooseEqual) {
		log.warn(
			`ignoring compiler output js change for ${next.filename} as it is equal to previous output after normalization`
		);
	}
	return !isLooseEqual;
}

function isCodeEqual(prev: string, next: string): boolean {
	if (!prev && !next) {
		return true;
	}
	if ((!prev && next) || (prev && !next)) {
		return false;
	}
	return prev === next;
}

/**
 * remove code that only changes metadata and does not require a js update for the component to keep working
 *
 * 1) add_location() calls. These add location metadata to elements, only useful for tooling like sapper studio
 * 2) ... maybe more (or less) in the future
 * @param code
 */
function normalizeJsCode(code: string): string {
	if (!code) {
		return code;
	}
	return code.replace(/\s*\badd_location\s*\([^)]*\)\s*;?/g, '');
}
