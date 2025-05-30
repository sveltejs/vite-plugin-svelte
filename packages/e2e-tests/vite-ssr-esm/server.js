// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import polka from 'polka';
import compression from 'compression';
import sirv from 'sirv';

let port = 3000;
const args = process.argv.slice(2);
const portArgPos = args.indexOf('--port') + 1;
if (portArgPos > 0) {
	port = parseInt(args[portArgPos], 10);
}

async function createServer(root = process.cwd(), isProd = process.env.NODE_ENV === 'production') {
	const resolve = (p) => path.resolve(root, p);

	const indexProd = isProd ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8') : '';

	const manifest = isProd
		? JSON.parse(fs.readFileSync(resolve('dist/client/.vite/ssr-manifest.json'), 'utf-8'))
		: {};

	const app = polka();

	/**
	 * @type {import('vite').ViteDevServer}
	 */
	let vite;
	if (!isProd) {
		/**
		 * @type {import('vite').InlineConfig}
		 */
		const inlineCfg = {
			root,
			appType: 'custom',
			server: {
				middlewareMode: true,
				port,
				strictPort: true,
				hmr: {
					port: port + 25000
				}
			}
		};

		vite = await (await import('vite')).createServer(inlineCfg);
		// use vite's connect instance as middleware
		app.use(vite.middlewares);
	} else {
		app.use(compression());
		app.use(
			sirv(resolve('dist/client'), {
				extensions: []
			})
		);
	}

	app.use('*', async (req, res) => {
		try {
			const url = req.originalUrl;

			let template, render;
			if (!isProd) {
				// always read fresh template in dev
				template = fs.readFileSync(resolve('index.html'), 'utf-8');
				template = await vite.transformIndexHtml(url, template);
				render = (await vite.ssrLoadModule('/src/entry-server.js')).render;
			} else {
				template = indexProd;
				render = (await import(pathToFileURL(resolve('dist/server/entry-server.js')).href)).render;
			}
			const rendered = await render(req.originalUrl, manifest);
			const appHtml = rendered.html;
			const headElements = rendered.head || '';
			// TODO what do we do with rendered.css here. find out if emitCss was used and vite took care of it
			const html = template
				.replace('<!--head-outlet-->', headElements)
				.replace('<!--app-outlet-->', appHtml);
			res.writeHead(200, { 'Content-Type': 'text/html' }).end(html);
		} catch (e) {
			if (vite) vite.ssrFixStacktrace(e);
			console.log(e.stack);
			res.writeHead(500, { 'Content-Type': 'text/plain' }).end(e.stack);
		}
	});

	return { app, vite };
}

createServer().then(({ app }) => {
	app.listen(port, () => {
		console.log('http://localhost:' + port);
	});
	const exitProcess = async () => {
		process.off('SIGTERM', exitProcess);
		process.off('SIGINT', exitProcess);
		process.stdin.off('end', exitProcess);
		try {
			await new Promise((resolve) => {
				app.server.close(() => {
					console.log('ssr server closed');
					resolve();
				});
			});
		} finally {
			// eslint-disable-next-line n/no-process-exit
			process.exit(0);
		}
	};
	process.once('SIGTERM', exitProcess);
	process.once('SIGINT', exitProcess);
	process.stdin.on('end', exitProcess);
});
