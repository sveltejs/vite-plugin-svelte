import fs from 'node:fs';
import path from 'node:path';
import { getText, isBuild, page, testDir } from '~utils';
import { expect } from 'vitest';

// minimal sourcemap VLQ decoder (no third-party dependency needed).
// returns decoded lines; each segment is absolute:
// [generatedColumn, sourceIndex?, originalLine?, originalColumn?, nameIndex?]
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const CHAR_TO_INT: Record<string, number> = {};
for (let i = 0; i < B64.length; i++) {
	CHAR_TO_INT[B64[i]] = i;
}

function decodeMappings(mappings: string): number[][][] {
	const lines: number[][][] = [];
	let line: number[][] = [];
	let segment: number[] = [];
	const state = [0, 0, 0, 0, 0];
	let i = 0;

	const pushSegment = () => {
		if (segment.length === 0) return;
		state[0] += segment[0];
		const absolute: number[] = [state[0]];
		if (segment.length >= 4) {
			state[1] += segment[1];
			state[2] += segment[2];
			state[3] += segment[3];
			absolute.push(state[1], state[2], state[3]);
			if (segment.length === 5) {
				state[4] += segment[4];
				absolute.push(state[4]);
			}
		}
		line.push(absolute);
		segment = [];
	};

	while (i < mappings.length) {
		const ch = mappings[i];
		if (ch === ';') {
			pushSegment();
			lines.push(line);
			line = [];
			state[0] = 0;
			i++;
			continue;
		}
		if (ch === ',') {
			pushSegment();
			i++;
			continue;
		}
		let shift = 0;
		let value = 0;
		let digit: number;
		do {
			digit = CHAR_TO_INT[mappings[i++]];
			value += (digit & 31) << shift;
			shift += 5;
		} while (digit & 32);
		const negative = value & 1;
		segment.push(negative ? -(value >> 1) : value >> 1);
	}
	pushSegment();
	lines.push(line);
	return lines;
}

test('should render the component', async () => {
	expect(await getText('body')).toContain('Hello, see devtools');
});

if (!isBuild) {
	// https://github.com/sveltejs/svelte/issues/18778
	// a plugin that transforms .svelte code before the svelte plugin must not
	// break sourcemap chaining: the generated location of `console.error` must
	// map back to its real position in the original App.svelte source.
	test('pre-transform sourcemaps chain back to the original svelte source', async () => {
		// expected original position, read from the untouched source fixture
		const source = fs.readFileSync(path.resolve(testDir, 'src/App.svelte'), 'utf8');
		const sourceLines = source.split('\n');
		const expectedLine = sourceLines.findIndex((line) => line.includes("console.error('helo')"));
		const expectedColumn = sourceLines[expectedLine].indexOf('console.error');
		expect(expectedLine).toBeGreaterThanOrEqual(0);

		const text = await page.evaluate(async () => {
			// runs in the browser, not in node
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			const res = await fetch('/src/App.svelte');
			if (!res.ok) {
				throw new Error(`failed to load App.svelte: ${res.status}`);
			}
			return res.text();
		});

		const mapMatch = text.match(/sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/);
		expect(mapMatch, 'module should contain an inline sourcemap').toBeTruthy();
		const map = JSON.parse(Buffer.from(mapMatch![1], 'base64').toString('utf8'));

		const generatedLines = text.split('\n');
		const errorLineIndex = generatedLines.findIndex(
			(line) => line.includes('console.error') && line.includes('helo')
		);
		expect(errorLineIndex).toBeGreaterThanOrEqual(0);

		const decoded = decodeMappings(map.mappings);
		const segments = decoded[errorLineIndex] ?? [];
		const mappedSegments = segments.filter((segment) => segment.length >= 4);

		expect(
			mappedSegments.length,
			'the generated console.error line must not lose its sourcemap segments'
		).toBeGreaterThan(0);

		// svelte maps script statements to the start of the source line
		// (column 0), so assert the mapped line is the console.error line and
		// that the mapped column lies on that line before the statement
		const matching = mappedSegments.find(
			(segment) =>
				segment[2] === expectedLine &&
				segment[3] >= 0 &&
				segment[3] <= expectedColumn &&
				// if sourcesContent is present, verify the mapped source line is
				// really the console.error line
				(map.sourcesContent?.[segment[1]]
					? map.sourcesContent[segment[1]].split('\n')[segment[2]]?.includes('console.error')
					: true)
		);
		expect(
			matching,
			`console.error should map back to the console.error line (line ${expectedLine + 1}) of App.svelte`
		).toBeTruthy();

		const sourceName = map.sources[matching![1]];
		expect(sourceName).toMatch(/App\.svelte(\?|$)/);
	});
}
