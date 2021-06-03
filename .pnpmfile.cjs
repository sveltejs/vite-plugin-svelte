const viteVersion = require('./package.json').devDependencies.vite;
function readPackage(pkg) {
	for (const section of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies'
	]) {
		// enforce use of workspace vite-plugin-svelte
		if (pkg[section]['@sveltejs/vite-plugin-svelte']) {
			pkg[section]['@sveltejs/vite-plugin-svelte'] = 'workspace:*';
		}
		// enforce use of workspace vite
		if(pkg[section]['vite']) {
			pkg[section]['vite'] = viteVersion;
		}
	}
	return pkg;
}

module.exports = {
	hooks: {
		readPackage
	}
};
