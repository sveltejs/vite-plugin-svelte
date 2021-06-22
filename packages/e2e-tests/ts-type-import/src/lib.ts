export interface Test {
	arg?: boolean;
}

export function test(): boolean {
	return Date.now() > 1;
}
