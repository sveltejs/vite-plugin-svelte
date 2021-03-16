const path = require('path');
const esbuild = require('esbuild');
const pkg = require(path.join(__dirname, '..', 'package.json'));

const external = [].concat(
	Object.keys(pkg.dependencies || {}),
	Object.keys(pkg.peerDependencies || {}),
	Object.keys(pkg.devDependencies || {}),
	Object.keys(pkg.optionalDependencies || {}),
	Object.keys(process.binding('natives')),
	'svelte/compiler'
);

const buildOptions = {
	platform: 'node',
	target: 'node12',
	entryPoints: ['src/index.ts'],
	outfile: 'dist/index.js',
	bundle: true,
	external,
	logLevel: 'warning',
	tsconfig: path.join(__dirname, '..', 'tsconfig.json')
};
const main = async () => {
	console.log(`bundling ${pkg.name} with esbuild`);
	await esbuild.build(buildOptions);
};

main().then(null, (err) => {
	console.error('esbuild failed', err);
	process.exit(1);
});
