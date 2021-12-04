import { RollupError } from 'rollup';
import { Warning } from './options';
import { buildExtendedLogMessage } from './log';
import { PartialMessage } from 'esbuild';
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

/**
 * convert an error thrown by svelte.compile to an esbuild PartialMessage
 * @param error
 * @returns {PartialMessage} the converted error
 */
export function toESBuildError(
	error: Warning & Error // a svelte compiler error is a mix of Warning and an error
): PartialMessage {
	const { filename, frame, start } = error;
	const partialMessage: PartialMessage = {
		text: buildExtendedLogMessage(error)
	};
	if (start) {
		partialMessage.location = {
			line: start.line,
			column: start.column,
			file: filename,
			lineText: lineFromFrame(start.line, frame) // needed to get a meaningful error message on cli
		};
	}
	return partialMessage;
}

function lineFromFrame(lineNo: number, frame?: string): string {
	if (!frame) {
		return '';
	}
	const lines = frame.split('\n');
	const errorLine = lines.find((line) => line.trimStart().startsWith(`${lineNo}: `));
	return errorLine ? errorLine.substring(errorLine.indexOf(': ') + 3) : '';
}
