function readPackage(pkg) {
	if (pkg.name === 'vite-plugin-svelte-monorepo' && !pkg.pnpm.overrides.vite) {
		pkg.pnpm.overrides.vite = pkg.devDependencies.vite;
	}
	return pkg;
}

module.exports = {
	hooks: {
		readPackage
	}
};
