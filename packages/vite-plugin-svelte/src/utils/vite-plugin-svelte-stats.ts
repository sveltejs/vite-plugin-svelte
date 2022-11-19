import { log } from './log';
//eslint-disable-next-line node/no-missing-import
import { findClosestPkgJsonPath } from 'vitefu';
import { readFileSync } from 'fs';

interface Stat {
	file: string;
	pkg?: string;
	duration?: number;
}

export interface StatCollection {
	name: string;
	options: CollectionOptions;
	//eslint-disable-next-line no-unused-vars
	start: (file: string) => () => void;
	stats: Stat[];
	packageStats?: PackageStats[];
	collectionStart: number;
	duration?: number;
	finish: () => Promise<void> | void;
}

interface PackageStats {
	pkg: string;
	files: number;
	duration: number;
}

export interface CollectionOptions {
	logProgress: boolean;
	//eslint-disable-next-line no-unused-vars
	logResult: (stats: Stat[]) => boolean;
}

const defaultCollectionOptions: CollectionOptions = {
	logProgress: true,
	logResult: () => true
};

function humanDuration(n: number) {
	// 99.9ms  0.10s
	return n < 100 ? `${n.toFixed(1)}ms` : `${(n / 1000).toFixed(2)}s`;
}

function formatProgress(name: string, count: number, duration: number, done = false) {
	return `${name} files:${`${count}`.padStart(5, ' ')} duration:${`${humanDuration(
		duration
	)}`.padStart(7, ' ')}${done ? ' - done' : ''}`;
}

function formatPackageStats(pkgStats: PackageStats[]) {
	const statLines = pkgStats.map((pkgStat) => {
		const duration = pkgStat.duration;
		const avg = duration / pkgStat.files;
		return [pkgStat.pkg, `${pkgStat.files}`, humanDuration(duration), humanDuration(avg)];
	});
	statLines.unshift(['package', 'files', 'duration', 'avg']);
	const columnWidths = statLines.reduce(
		(widths: number[], row) => {
			for (let i = 0; i < row.length; i++) {
				const cell = row[i];
				if (widths[i] < cell.length) {
					widths[i] = cell.length;
				}
			}
			return widths;
		},
		statLines[0].map(() => 0)
	);

	const table = statLines
		.map((row: string[]) =>
			row
				.map((cell: string, i: number) => {
					if (i === 0) {
						return cell.padEnd(columnWidths[i], ' ');
					} else {
						return cell.padStart(columnWidths[i], ' ');
					}
				})
				.join('\t')
		)
		.join('\n');
	return table;
}

export class VitePluginSvelteStats {
	// package directory -> package name
	private _packages: { path: string; name: string }[] = [];
	startCollection(name: string, options: CollectionOptions = defaultCollectionOptions) {
		const stats: Stat[] = [];
		const collectionStart = performance.now();
		let lastProgressLog = 0;
		const parent = this;
		const collection: StatCollection = {
			name,
			options,
			stats,
			collectionStart,
			start(file) {
				const stat: Stat = { file };
				const start = performance.now();
				return () => {
					const now = performance.now();
					stat.duration = now - start;
					stats.push(stat);
					if (
						options.logProgress &&
						now - (lastProgressLog || collectionStart) > (lastProgressLog ? 200 : 2000)
					) {
						lastProgressLog = now;
						log.info.progress(formatProgress(name, stats.length, now - collectionStart), false);
					}
				};
			},
			async finish() {
				const now = performance.now();
				collection.duration = now - collectionStart;
				if (options.logProgress && lastProgressLog) {
					log.info.progress(formatProgress(name, stats.length, now - collectionStart, true), true);
				}
				if (options.logResult(collection.stats)) {
					await parent._aggregateStatsResult(collection);
					if (!lastProgressLog) {
						log.info(formatProgress(name, stats.length, now - collectionStart, true));
					}
					log.info(`${collection.name} details:`, formatPackageStats(collection.packageStats!));
				}
				//cut some ties to free it for garbage collection
				stats.length = 0;
				collection.stats = [];
				if (collection.packageStats) {
					collection.packageStats.length = 0;
				}
				collection.start = () => () => {};
				collection.finish = () => {};
			}
		};
		return collection;
	}

	private async _aggregateStatsResult(collection: StatCollection) {
		const stats = collection.stats;
		// find package for all files in stats
		await Promise.all(
			stats.map(async (stat) => {
				let pkg = this._packages.find((p) => stat.file.startsWith(p.path));
				if (!pkg) {
					// check for package.json first
					let pkgPath = await findClosestPkgJsonPath(stat.file);
					if (pkgPath) {
						let path = pkgPath?.replace(/package.json$/, '');
						let name = JSON.parse(readFileSync(pkgPath, 'utf-8')).name;
						if (!name) {
							// some packages have nameless nested package.json
							pkgPath = await findClosestPkgJsonPath(path);
							if (pkgPath) {
								path = pkgPath?.replace(/package.json$/, '');
								name = JSON.parse(readFileSync(pkgPath, 'utf-8')).name;
							}
						}
						if (path && name) {
							pkg = { path, name };
							this._packages.push(pkg);
						}
					}
				}
				// TODO is it possible that we want to track files where there is no named packge.json as parent?
				// what do we want to do for that, try to find common root paths for different stats?
				stat.pkg = pkg?.name ?? '$unknown';
			})
		);

		// group stats
		const grouped: { [key: string]: PackageStats } = {};
		stats.forEach((stat) => {
			const pkg = stat.pkg!;
			let group = grouped[pkg];
			if (!group) {
				group = grouped[pkg] = {
					files: 0,
					duration: 0,
					pkg
				};
			}
			if (stat.duration != null) {
				group.files += 1;
				group.duration += stat.duration;
			}
		});

		const groups = Object.values(grouped);
		groups.sort((a, b) => b.duration - a.duration);
		collection.packageStats = groups;
	}
}
