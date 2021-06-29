// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const path = require('path');

/**
 * @param {string} root
 * @param {boolean} isBuild
 * @param {number} port
 */
exports.serve = async function serve(root, isBuild, port) {
	if (isBuild) {
		// build first
		const { build } = require('vite');
		// client build
		await build({
			root,
			logLevel: 'error',
			build: {
				target: 'esnext',
				minify: false,
				ssrManifest: true,
				outDir: 'dist/client'
			}
		});
		// server build
		await build({
			root,
			logLevel: 'error',
			build: {
				target: 'esnext',
				ssr: 'src/entry-server.js',
				outDir: 'dist/server'
			}
		});
	}

	const { createServer } = require(path.resolve(root, 'server.js'));
	const { app, vite } = await createServer(root, isBuild, true);

	return new Promise((resolve, reject) => {
		try {
			const server = app.listen(port, () => {
				resolve({
					// for test teardown
					port: port,
					async close() {
						let err;
						if (server) {
							err = await new Promise((resolve) => {
								server.close(resolve);
							});
						}
						if (vite) {
							try {
								await vite.close();
							} catch (e) {
								if (!err) {
									err = e;
								}
							}
						}
						if (err) {
							throw err;
						}
					}
				});
			});
		} catch (e) {
			reject(e);
		}
	});
};
