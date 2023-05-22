import type { InlineConfig, ResolvedConfig } from 'vite';
export type CssTransform = (
	code: string,

	filename: string
) => Promise<{ code: string; map?: any; deps?: Set<string> }>;
