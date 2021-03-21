// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const execa = require('execa');

/**
 * @param {string} root
 * @param {boolean} isProd
 */
exports.serve = async function serve(root, isProd) {
	if (isProd) {
		await execa('svelte-kit', ['build'], { stdio: 'inherit', preferLocal: true, cwd: root });
	}

	return new Promise((resolve, reject) => {
		try {
			const serverProcess = execa('svelte-kit', [isProd ? 'start' : 'dev'], {
				preferLocal: true,
				cwd: root,
				cleanup: true
			});
			serverProcess.stdout.pipe(process.stdout);
			serverProcess.stderr.pipe(process.stderr);

			const resolveWhenStarted = (data) => {
				const str = data.toString();
				// hack, console output may contain color code gibberish
				// skip gibberish between localhost: and port number starting with 3
				const match = str.match(/(http:\/\/localhost:)(?:[^3]*)(\d+)/);
				if (match) {
					serverProcess.stdout.off('data', resolveWhenStarted);
					resolve({
						port: parseInt(match[2], 10),
						async close() {
							return serverProcess && serverProcess.kill() && (await serverProcess);
						}
					});
				}
			};
			serverProcess.stdout.on('data', resolveWhenStarted);
		} catch (e) {
			reject(e);
		}
	});
};
