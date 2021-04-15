import { SvelteRequest } from './id';
import { Code, CompileData } from './compile';

export class VitePluginSvelteCache {
	private _css = new Map<string, Code>();
	private _js = new Map<string, Code>();

	public update(compileData: CompileData) {
		const id = compileData.normalizedFilename;
		this._css.set(id, compileData.compiled.css);
		if (!compileData.ssr) {
			// do not cache SSR js
			this._js.set(id, compileData.compiled.js);
		}
	}

	public getCSS(svelteRequest: SvelteRequest) {
		return this._css.get(svelteRequest.normalizedFilename);
	}

	public getJS(svelteRequest: SvelteRequest) {
		if (!svelteRequest.ssr) {
			// SSR js isn't cached
			return this._js.get(svelteRequest.normalizedFilename);
		}
	}
}
