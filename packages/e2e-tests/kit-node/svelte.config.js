import node from '@sveltejs/adapter-node';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: node()
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};
export default config;
