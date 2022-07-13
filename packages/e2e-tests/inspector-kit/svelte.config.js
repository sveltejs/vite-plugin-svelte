/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {},
	vitePlugin: {
		experimental: {
			inspector: {
				showToggleButton: 'always'
			}
		}
	}
};

export default config;
