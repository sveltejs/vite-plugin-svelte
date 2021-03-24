import { test, Test } from './lib';

main();

export function main({ arg = true }: Test = {}): void {
	if (arg) test();
}
