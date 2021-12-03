import { RollupError } from 'rollup';
import { Warning } from './options';
import { buildExtendedLogMessage } from './log';

/**
 * convert an error thrown by svelte.compile to a RollupError so that vite displays it in a user friendly way
 * @param error
 * @returns {RollupError} the converted error
 */
export function toRollupError(
	error: Warning & Error // a svelte compiler error is a mix of Warning and an error
): RollupError {
	const { filename, frame, start, code, name } = error;
	const rollupError: RollupError = {
		name, // needed otherwise sveltekit coalesce_to_error turns it into a string
		id: filename,
		message: buildExtendedLogMessage(error), // include filename:line:column so that it's clickable
		frame,
		code
	};
	if (start) {
		rollupError.loc = {
			line: start.line,
			column: start.column,
			file: filename
		};
	}
	return rollupError;
}
