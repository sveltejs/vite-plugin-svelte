// @ts-check
// this is automtically detected by scripts/jestPerTestSetup.ts and will replace
// the default e2e test serve behavior

const execa = require('execa');
const treeKill = require('tree-kill');
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
			const serverProcess = execa(
				'svelte-kit',
				[isProd ? 'preview' : 'dev', '--port', isProd ? '3200' : '3201'],
				{
					preferLocal: true,
					cwd: root,
					cleanup: true
				}
			);
			serverProcess.stdout.pipe(process.stdout);
			serverProcess.stderr.pipe(process.stderr);

			const resolveWhenStarted = (data) => {
				const str = data.toString();
				// hack, console output may contain color code gibberish
				// skip gibberish between localhost: and port number starting with 3
				const match = str.match(/(http:\/\/localhost:)(?:[^3]*)(\d+)/);
				if (match) {
					serverProcess.stdout.off('data', resolveWhenStarted);
					const customServer = {
						port: parseInt(match[2], 10),
						async close() {
							if (serverProcess) {
								// ensure started svelte-kit process is gone including all subprocesses
								return new Promise((resolve, reject) =>
									treeKill(serverProcess.pid, (err) => {
										err ? reject(err) : resolve();
									})
								);
							}
						}
					};
					resolve(customServer);
				}
			};

			serverProcess.stdout.on('data', resolveWhenStarted);
		} catch (e) {
			reject(e);
		}
	});
};
