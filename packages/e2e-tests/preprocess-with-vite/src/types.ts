export type Hello = 'Hello';

/** Value only referenced from Svelte template markup (not from script). Regression #1313. */
export const templateOnlyMarker = 'template-only-import-preserved';
