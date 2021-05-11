import * as fs from 'fs-extra';
import * as http from 'http';
import * as path from 'path';
import sirv from 'sirv';
import { createServer, build, ViteDevServer, UserConfig } from 'vite';
import { Page } from 'playwright-core';

const isBuildTest = !!process.env.VITE_TEST_BUILD;

// injected by the test env
declare global {
	// eslint-disable-next-line no-unused-vars
	namespace NodeJS {
		// eslint-disable-next-line no-unused-vars
		interface Global {
			page?: Page;
			viteTestUrl?: string;
		}
	}
}

interface CustomServer {
	port: number;
	base?: string;
	close: () => {};
}

let server: ViteDevServer | http.Server | CustomServer;
let tempDir: string;
let err: Error;

const logs = ((global as any).browserLogs = []);
const onConsole = (msg) => {
	logs.push(msg.text());
};

beforeAll(async () => {
	const page = global.page;
	if (!page) {
		return;
	}
	try {
		page.on('console', onConsole);

		const testPath = expect.getState().testPath;
		const segments = testPath.split(path.sep);
		const testName = segments.includes('playground')
			? segments[segments.indexOf('playground') + 1]
			: null;

		// if this is a test placed under playground/xxx/__tests__
		// start a vite server in that directory.
		if (testName) {
			const playgroundRoot = path.resolve(__dirname, '../packages/playground');
			const srcDir = path.resolve(playgroundRoot, testName);
			tempDir = path.resolve(__dirname, '../temp', isBuildTest ? 'build' : 'serve', testName);
			const directoriesToIgnore = ['node_modules', '__tests__', 'dist', 'build', '.svelte'];
			const isIgnored = (file) => {
				const segments = file.split(path.sep);
				return segments.some((segment) => directoriesToIgnore.includes(segment));
			};
			await fs.copy(srcDir, tempDir, {
				dereference: true,
				filter(file) {
					return !isIgnored(file);
				}
			});

			const playground_node_modules = path.join(srcDir, 'node_modules');
			const temp_node_modules = path.join(tempDir, 'node_modules');
			if (fs.existsSync(temp_node_modules)) {
				console.error('temp node_modules already exist', temp_node_modules);
			}
			await fs.symlink(playground_node_modules, temp_node_modules, 'dir');
			const stat = fs.lstatSync(temp_node_modules);
			if (!stat.isSymbolicLink()) {
				console.error(`failed to symlink ${playground_node_modules} to ${temp_node_modules}`);
			}
			const testCustomServe = path.resolve(path.dirname(testPath), 'serve.js');
			if (fs.existsSync(testCustomServe)) {
				// test has custom server configuration.
				const { serve } = require(testCustomServe);
				const customServer: CustomServer = await serve(tempDir, isBuildTest);
				server = customServer;
				// use resolved port/base from server
				const port = customServer.port;
				const base = customServer.base && customServer.base !== '/' ? `/${customServer.base}` : '';
				const url = (global.viteTestUrl = `http://localhost:${port}${base}`);
				await page.goto(url);
				return;
			}

			const options: UserConfig = {
				root: tempDir,
				logLevel: 'error',
				server: {
					watch: {
						// During tests we edit the files too fast and sometimes chokidar
						// misses change events, so enforce polling for consistency
						usePolling: true,
						interval: 100
					}
				},
				build: {
					// skip transpilation and dynamic import polyfills during tests to
					// make it faster
					target: 'esnext'
				}
			};

			if (!isBuildTest) {
				process.env.VITE_INLINE = 'inline-serve';
				server = await (await createServer(options)).listen();
				// use resolved port/base from server
				const base = server.config.base === '/' ? '' : server.config.base;
				const url = (global.viteTestUrl = `http://localhost:${server.config.server.port}${base}`);
				await page.goto(url);
			} else {
				process.env.VITE_INLINE = 'inline-build';
				await build(options);
				const url = (global.viteTestUrl = await startStaticServer());
				await page.goto(url);
			}
		}
	} catch (e) {
		// jest doesn't exit if our setup has error here
		// https://github.com/facebook/jest/issues/2713
		err = e;

		// tests are still executed so close page to shorten
		try {
			await page.close();
		} catch (e2) {
			console.error('failed to close page on error', e2);
		}
	}
}, 30000);

afterAll(async () => {
	try {
		global.page?.off('console', onConsole);
		await global.page?.close();
	} catch (e) {
		console.error('failed to close test page', e);
		if (!err) {
			err = e;
		}
	}
	try {
		await server?.close();
	} catch (e) {
		console.error('failed to close test server', e);
		if (!err) {
			err = e;
		}
	}

	// unlink node modules to prevent removal of linked modules on cleanup
	const temp_node_modules = path.join(tempDir, 'node_modules');
	try {
		await fs.unlink(temp_node_modules);
	} catch (e) {
		console.error(`failed to unlink ${temp_node_modules}`);
		if (!err) {
			err = e;
		}
	}

	if (err) {
		throw err;
	}
});

function startStaticServer(): Promise<string> {
	// check if the test project has base config
	const configFile = path.resolve(tempDir, 'vite.config.js');
	let config: UserConfig;
	try {
		config = require(configFile);
		// eslint-disable-next-line no-empty
	} catch (e) {}
	const base = (config?.base || '/') === '/' ? '' : config.base;

	// @ts-ignore
	if (config && config.__test__) {
		// @ts-ignore
		config.__test__();
	}

	// start static file server
	const serve = sirv(path.resolve(tempDir, 'dist'));
	const httpServer = (server = http.createServer((req, res) => {
		if (req.url === '/ping') {
			res.statusCode = 200;
			res.end('pong');
		} else {
			serve(req, res);
		}
	}));
	let port = 5000;
	return new Promise((resolve, reject) => {
		const onError = (e: any) => {
			if (e.code === 'EADDRINUSE') {
				httpServer.close();
				httpServer.listen(++port);
			} else {
				reject(e);
			}
		};
		httpServer.on('error', onError);
		httpServer.listen(port, () => {
			httpServer.removeListener('error', onError);
			resolve(`http://localhost:${port}${base}`);
		});
	});
}
