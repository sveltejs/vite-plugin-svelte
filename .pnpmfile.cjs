const {vite,esbuild} = require('./package.json').devDependencies;

function readPackage(pkg) {
	for (const section of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies'
	]) {
		// enforce use of workspace vite-plugin-svelte
		// integration testing with svelte-kit would test outdated version otherwise
		if (pkg[section]['@sveltejs/vite-plugin-svelte']) {
			pkg[section]['@sveltejs/vite-plugin-svelte'] = 'workspace:*';
		}
		// enforce use of workspace vite
		// integration testing with svelte-kit would test outdated version otherwise
		if(pkg[section]['vite']) {
			pkg[section]['vite'] = vite;
		}

		// enforce use of workspace esbuild
		// to ensure a single version is used and
		if(pkg[section]['esbuild']) {
			pkg[section]['esbuild'] = esbuild;
		}
	}
	return pkg;
}

module.exports = {
	hooks: {
		readPackage
	}
};
