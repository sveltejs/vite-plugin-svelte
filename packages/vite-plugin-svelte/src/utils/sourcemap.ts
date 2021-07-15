import MagicString, { MagicStringOptions } from 'magic-string';
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT } from 'diff-match-patch';

export function buildMagicString(
	from: string,
	to: string,
	options?: MagicStringOptions
): MagicString {
	const dmp = new diff_match_patch();
	const diffs = dmp.diff_main(from, to);
	dmp.diff_cleanupSemantic(diffs);
	const m = new MagicString(from, options);
	let pos = 0;
	for (let i = 0; i < diffs.length; i++) {
		const diff = diffs[i];
		const nextDiff = diffs[i + 1];
		if (diff[0] === DIFF_DELETE) {
			if (nextDiff?.[0] === DIFF_INSERT) {
				// delete followed by insert, use overwrite and skip ahead
				m.overwrite(pos, pos + diff[1].length, nextDiff[1]);
				i++;
			} else {
				m.remove(pos, pos + diff[1].length);
			}
			pos += diff[1].length;
		} else if (diff[0] === DIFF_INSERT) {
			if (nextDiff) {
				m.appendRight(pos, diff[1]);
			} else {
				m.append(diff[1]);
			}
		} else {
			// unchanged block, advance pos
			pos += diff[1].length;
		}
	}
	// at this point m.toString() === to
	return m;
}

export function buildSourceMap(from: string, to: string, filename?: string) {
	const m = buildMagicString(from, to);
	return m.generateDecodedMap({ hires: true, file: filename });
}
