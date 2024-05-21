import node from '@sveltejs/adapter-node';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: node()
	},
	compilerOptions: {
		hmr: true // for some reason process.env.NODE_ENV==='development' doesn't work here
	}
};
export default config;
