import { log } from './log';
import { performance } from 'perf_hooks';
import { normalizePath } from 'vite';
import { VitePluginSvelteCache } from './vite-plugin-svelte-cache';

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
	private _cache: VitePluginSvelteCache;
	private _collections: StatCollection[] = [];
	constructor(cache: VitePluginSvelteCache) {
		this._cache = cache;
	}
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
				file = normalizePath(file);
				const start = performance.now();
				const stat: Stat = { file, start, end: start };
				return () => {
					const now = performance.now();
					stat.end = now;
					stats.push(stat);
					if (!hasLoggedProgress && options.logInProgress(collection, now)) {
						hasLoggedProgress = true;
						log.debug(`${name} in progress ...`, undefined, 'stats');
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
		try {
			collection.finished = true;
			const now = performance.now();
			collection.duration = now - collection.collectionStart;
			const logResult = collection.options.logResult(collection);
			if (logResult) {
				await this._aggregateStatsResult(collection);
				log.debug(
					`${collection.name} done.\n${formatPackageStats(collection.packageStats!)}`,
					undefined,
					'stats'
				);
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
		} catch (e) {
			// this should not happen, but stats taking also should not break the process
			log.debug.once(`failed to finish stats for ${collection.name}\n`, e, 'stats');
		}
	}

	private async _aggregateStatsResult(collection: StatCollection) {
		const stats = collection.stats;
		for (const stat of stats) {
			stat.pkg = (await this._cache.getPackageInfo(stat.file)).name;
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
