// script to start package.json dev/build/preview scripts with execa for e2e tests
import { execa } from 'execa';
import treeKill from 'tree-kill';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { rootDir } from 'vitest/node';
const isWin = process.platform === 'win32';

async function startedOnPort(serverProcess, port, timeout) {
	let id;
	let stdoutListener;
	const timerPromise = new Promise(
		(_, reject) =>
			(id = setTimeout(() => {
				reject(`timeout for server start after ${timeout}`);
			}, timeout))
	);
	const startedPromise = new Promise((resolve, reject) => {
		stdoutListener = (data) => {
			const str = data.toString();
			// hack, console output may contain color code gibberish
			// skip gibberish between localhost: and port number.
			// Vite may print other host then `localhost` for machines
			// with different DNS resove order, as Node <17 does not
			// respect the order by default.
			const match = str.match(/(http:\/\/(?:localhost|127.0.0.1|\[::1\]):)(?:.*)(\d{4})/);
			if (match) {
				const startedPort = parseInt(match[2], 10);
				if (startedPort === port) {
					resolve();
				} else {
					const msg = `test server started on ${startedPort} instead of ${port}`;
					console.log(msg);
					reject(msg);
				}
			}
		};

		serverProcess.stdout.on('data', stdoutListener);
	});

	return Promise.race([timerPromise, startedPromise]).finally(() => {
		serverProcess.stdout.off('data', stdoutListener);
		clearTimeout(id);
	});
}

async function buildWatchIdle(watchProcess, timeout) {
	let id;
	let stdoutListener;
	const timerPromise = new Promise(
		(_, reject) =>
			(id = setTimeout(() => {
				reject(`timeout for server start after ${timeout}`);
			}, timeout))
	);
	const startedPromise = new Promise((resolve, reject) => {
		stdoutListener = (data) => {
			const str = data.toString();
			const match = str.match(/built in \d+ms\./);
			if (match) {
				resolve();
			}
		};
		watchProcess.stdout.on('data', stdoutListener);
	});

	return Promise.race([timerPromise, startedPromise]).finally(() => {
		watchProcess.stdout.off('data', stdoutListener);
		clearTimeout(id);
	});
}

export async function serve(root, testMode, port) {
	const logDir = path.join(root, 'logs');
	const logs = {
		server: null,
		build: null
	};

	const pushLines = (str, arr) => {
		const lines = str.split(/\r?\n/);
		if (lines[lines.length - 1] === '') {
			lines.pop(); // last element empty means str ended with \n, remove it or we end up with extra \n when joining again
		}
		Array.prototype.push.apply(arr, lines);
	};
	const collectLogs = (proc, { out, err }) => {
		proc.stdout.on('data', (d) => pushLines(d.toString(), out));
		proc.stderr.on('data', (d) => pushLines(d.toString(), err));
	};

	const writeLogs = async (name, result) => {
		try {
			if (result.out && result.out.length > 0) {
				fs.writeFileSync(path.join(logDir, `${name}.log`), result.out.join('\n'), 'utf-8');
			}
			if (result.err && result.err.length > 0) {
				fs.writeFileSync(path.join(logDir, `${name}.err.log`), result.err.join('\n'), 'utf-8');
			}
		} catch (e1) {
			console.error(`failed to write ${name} logs in ${logDir}`, e1);
		}
	};

	const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
	if (pkg.scripts?.sync) {
		try {
			await execa('pnpm', ['sync']);
		} catch (e) {
			console.error(`Failed to run sync script in ${rootDir}`);
			throw e;
		}
	}

	if (testMode === 'build') {
		let buildResult;
		let hasErr = false;
		const out = [];
		const err = [];

		try {
			const buildProcess = execa('pnpm', ['build'], {
				cwd: root,
				stdio: 'pipe',
				env: {
					NODE_ENV: 'production'
				}
			});
			logs.build = { out, err };
			collectLogs(buildProcess, logs.build);
			await buildProcess;
		} catch (e) {
			buildResult = e;
			if (buildResult.stdout) {
				pushLines(buildResult.stdout, out);
			}
			if (buildResult.stderr) {
				pushLines(buildResult.stderr, err);
			}
			hasErr = true;
		}
		await writeLogs('build', logs.build);
		if (hasErr) {
			throw buildResult;
		}
	}
	let watchProcess;
	if (testMode === 'build:watch') {
		watchProcess = execa('pnpm', ['build', '--watch'], {
			cwd: root,
			stdio: 'pipe'
		});
		logs.watch = { out: [], err: [] };
		collectLogs(watchProcess, logs.watch);
		await buildWatchIdle(watchProcess, 10000);
	}

	const serverProcess = execa(
		'pnpm',
		[testMode === 'serve' ? 'dev' : 'preview', '--port', port, '--strictPort'],
		{
			cwd: root,
			stdio: 'pipe'
		}
	);
	logs.server = { out: [], err: [] };
	collectLogs(serverProcess, logs.server);

	const closeServer = async () => {
		for (const p of [watchProcess, serverProcess]) {
			if (p) {
				if (p.pid) {
					await new Promise((resolve) => {
						treeKill(p.pid, (err) => {
							if (err) {
								console.error(
									`failed to treekill ${p === watchProcess ? 'watchprocess' : 'serverprocess'} ${p.pid}`,
									err
								);
							}
							resolve();
						});
					});
				} else {
					p.cancel();
				}

				try {
					await p;
				} catch (e) {
					const { out, err } = p === watchProcess ? logs.watch : logs.server;
					if (e.stdout) {
						pushLines(e.stdout, out);
					}
					if (e.stderr) {
						pushLines(e.stderr, err);
					}
					if (!!process.env.DEBUG && !isWin) {
						// treekill on windows uses taskkill and that ends up here always
						console.debug(`e2e server process did not exit gracefully. dir: ${root}`, e);
					}
				}
			}
		}

		await writeLogs('server', logs.server);
		if (logs.watch) {
			await writeLogs('watch', logs.watch);
		}
	};
	try {
		await startedOnPort(serverProcess, port, 10000);
		return {
			port,
			logs,
			close: closeServer
		};
	} catch (e) {
		try {
			await closeServer();
		} catch (e1) {
			console.error('failed to close server process', e1);
		}
	}
}
