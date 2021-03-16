import { SvelteRequest } from './id';
import { CompileData } from './compile';

export class VitePluginSvelteCache {
	private _compile = new Map<string, CompileData>();
	private _compileSSR = new Map<string, CompileData>();

	private selectCache(ssr: boolean): Map<string, CompileData> {
		return ssr ? this._compileSSR : this._compile;
	}

	public getCompileData(
		svelteRequest: SvelteRequest,
		errorOnMissing = true
	): CompileData | undefined {
		const cache = this.selectCache(svelteRequest.ssr);
		const id = svelteRequest.normalizedFilename;
		if (cache.has(id)) {
			return cache.get(id)!;
		}
		if (errorOnMissing) {
			throw new Error(
				`${id} has no corresponding entry in the ${svelteRequest.ssr ? 'ssr' : ''}cache. ` +
					`This is a @sveltejs/vite-plugin-svelte internal error, please open an issue.`
			);
		}
	}

	public setCompileData(compileData: CompileData) {
		const cache = this.selectCache(!!compileData.ssr);
		const id = compileData.normalizedFilename;
		cache.set(id, compileData);
	}

	// TODO accessors by id/url?
	// TODO expose on plugin instance?
}
