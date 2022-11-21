import { log } from './log';
//eslint-disable-next-line node/no-missing-import
import { findClosestPkgJsonPath } from 'vitefu';
import { readFileSync } from 'fs';
import { performance } from 'perf_hooks';

interface Stat {
	file: string;
	pkg?: string;
	start: number;
	end: number;
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
	finished: boolean;
}

interface PackageStats {
	pkg: string;
	files: number;
	duration: number;
}

export interface CollectionOptions {
	//eslint-disable-next-line no-unused-vars
	logInProgress: (collection: StatCollection, now: number) => boolean;
	//eslint-disable-next-line no-unused-vars
	logResult: (collection: StatCollection) => boolean;
}

const defaultCollectionOptions: CollectionOptions = {
	// log after 500ms and more than one file processed
	logInProgress: (c, now) => now - c.collectionStart > 500 && c.stats.length > 1,
	// always log results
	logResult: () => true
};

function humanDuration(n: number) {
	// 99.9ms  0.10s
	return n < 100 ? `${n.toFixed(1)}ms` : `${(n / 1000).toFixed(2)}s`;
}

function formatPackageStats(pkgStats: PackageStats[]) {
	const statLines = pkgStats.map((pkgStat) => {
		const duration = pkgStat.duration;
		const avg = duration / pkgStat.files;
		return [pkgStat.pkg, `${pkgStat.files}`, humanDuration(duration), humanDuration(avg)];
	});
	statLines.unshift(['package', 'files', 'time', 'avg']);
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
	private _collections: StatCollection[] = [];
	startCollection(name: string, opts?: Partial<CollectionOptions>) {
		const options = {
			...defaultCollectionOptions,
			...opts
		};
		const stats: Stat[] = [];
		const collectionStart = performance.now();
		const _this = this;
		let hasLoggedProgress = false;
		const collection: StatCollection = {
			name,
			options,
			stats,
			collectionStart,
			finished: false,
			start(file) {
				if (collection.finished) {
					throw new Error('called after finish() has been used');
				}
				const start = performance.now();
				const stat: Stat = { file, start, end: start };
				return () => {
					const now = performance.now();
					stat.end = now;
					stats.push(stat);
					if (!hasLoggedProgress && options.logInProgress(collection, now)) {
						hasLoggedProgress = true;
						log.info(`${name} in progress ...`);
					}
				};
			},
			async finish() {
				await _this._finish(collection);
			}
		};
		_this._collections.push(collection);
		return collection;
	}

	public async finishAll() {
		await Promise.all(this._collections.map((c) => c.finish()));
	}

	private async _finish(collection: StatCollection) {
		collection.finished = true;
		const now = performance.now();
		collection.duration = now - collection.collectionStart;
		const logResult = collection.options.logResult(collection);
		if (logResult) {
			await this._aggregateStatsResult(collection);
			log.info(`${collection.name} done.`, formatPackageStats(collection.packageStats!));
		}
		// cut some ties to free it for garbage collection
		const index = this._collections.indexOf(collection);
		this._collections.splice(index, 1);
		collection.stats.length = 0;
		collection.stats = [];
		if (collection.packageStats) {
			collection.packageStats.length = 0;
			collection.packageStats = [];
		}
		collection.start = () => () => {};
		collection.finish = () => {};
	}

	private async _aggregateStatsResult(collection: StatCollection) {
		const stats = collection.stats;
		for (const stat of stats) {
			const pkg = this._packages.find((p) => stat.file.startsWith(p.path));
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
						this._packages.push({ path, name });
					}
				}
			}
			// TODO is it possible that we want to track files where there is no named packge.json as parent?
			// what do we want to do for that, try to find common root paths for different stats?
			stat.pkg = pkg?.name ?? '$unknown';
		}

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
			group.files += 1;
			group.duration += stat.end - stat.start;
		});

		const groups = Object.values(grouped);
		groups.sort((a, b) => b.duration - a.duration);
		collection.packageStats = groups;
	}
}
