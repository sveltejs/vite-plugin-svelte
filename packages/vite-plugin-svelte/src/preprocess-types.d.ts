import type { InlineConfig, ResolvedConfig } from 'vite';
export type CssTransform = (
	// eslint-disable-next-line no-unused-vars
	code: string,
	// eslint-disable-next-line no-unused-vars
	filename: string
) => Promise<{ code: string; map?: any; deps?: Set<string> }>;

export interface VitePreprocessOptions {
	script?: boolean;
	style?: boolean | InlineConfig | ResolvedConfig;
}
