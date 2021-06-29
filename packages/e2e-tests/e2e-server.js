// script to start package.json dev/build/preview scripts with execa for e2e tests
const execa = require('execa');
const treeKill = require('tree-kill');
const fs = require('fs/promises');
const path = require('path');

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
			// skip gibberish between localhost: and port number
			const match = str.match(/(http:\/\/localhost:)(?:[^35]*)(\d{5})/);
			if (match) {
				const startedPort = parseInt(match[2], 10);
				if (startedPort === port) {
					resolve();
				} else {
					reject(`test server started on ${startedPort} instead of ${port}`);
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

exports.serve = async function serve(root, isBuild, port) {
	const logDir = path.join(root, 'logs');
	const logs = {
		server: null,
		build: null
	};
	const writeLogs = async (name, result) => {
		try {
			result.out &&
				result.out.length > 0 &&
				(await fs.writeFile(path.join(logDir, `${name}.log`), result.out.join(''), 'utf-8'));
			result.err &&
				result.err.length > 0 &&
				(await fs.writeFile(path.join(logDir, `${name}.err.log`), result.err.join(''), 'utf-8'));
		} catch (e1) {
			console.error(`failed to write ${name} logs in ${logDir}`, e1);
		}
	};

	if (isBuild) {
		let buildResult;
		let hasErr = false;
		let out = [];
		let err = [];

		try {
			const buildProcess = execa('pnpm', ['build'], { preferLocal: true, cwd: root });
			logs.build = { out, err };
			buildProcess.stdout.on('data', (d) => out.push(d.toString()));
			buildProcess.stderr.on('data', (d) => err.push(d.toString()));
			await buildProcess;
		} catch (e) {
			buildResult = e;
			if (buildResult.stdout) {
				out.push(buildResult.stdout);
			}
			if (buildResult.stderr) {
				out.push(buildResult.stderr);
			}
			hasErr = true;
		}
		await writeLogs('build', logs.build);
		if (hasErr) {
			throw buildResult;
		}
	}

	const serverProcess = execa('pnpm', [isBuild ? 'preview' : 'dev', '--', '--port', port], {
		preferLocal: true,
		cwd: root
	});
	const out = [],
		err = [];
	logs.server = { out, err };
	serverProcess.stdout.on('data', (d) => out.push(d.toString()));
	serverProcess.stderr.on('data', (d) => err.push(d.toString()));

	const closeServer = async () => {
		if (serverProcess && serverProcess.pid) {
			await new Promise((resolve) => {
				treeKill(serverProcess.pid, (err) => {
					if (err) {
						console.error(`failed to treekill serverprocess ${serverProcess.pid}`, err);
					}
					resolve();
				});
			});
		} else if (serverProcess) {
			serverProcess.cancel();
		}

		let serverResult;
		let hasErr = false;
		try {
			serverResult = await serverProcess;
		} catch (e) {
			serverResult = e;
			hasErr = true;
		}
		if (serverResult.stdout) {
			out.push(serverResult.stdout);
		}
		if (serverResult.stderr) {
			out.push(serverResult.stderr);
		}
		await writeLogs('server', logs.server);
		if (hasErr) {
			throw serverResult;
		}
	};
	try {
		await startedOnPort(serverProcess, port, 20000);
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
};
