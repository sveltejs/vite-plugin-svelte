function readPackage(pkg) {
	for (const section of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies'
	]) {
		// enforce use of workspace vite-plugin-svelte
		// TODO remove linking of svitejs one once kit released migration
		if (pkg[section]['@svitejs/vite-plugin-svelte']) {
			pkg[section]['@svitejs/vite-plugin-svelte'] = 'workspace:@sveltejs/vite-plugin-svelte@*';
		} else if (pkg[section]['@sveltejs/vite-plugin-svelte']) {
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
