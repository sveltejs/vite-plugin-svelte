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
	}
	return pkg;
}

module.exports = {
	hooks: {
		readPackage
	}
};
