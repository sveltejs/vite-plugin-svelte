// eslint-disable-next-line node/no-missing-import
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte/preprocess';
export default {
	preprocess: [vitePreprocess()],
	vitePlugin: {
		experimental: {
			useVitePreprocess: true,
			emitPreprocessed(fileName, processed) {
				return {
					fileName,
					source: processed.code
				};
			}
		}
	}
};
