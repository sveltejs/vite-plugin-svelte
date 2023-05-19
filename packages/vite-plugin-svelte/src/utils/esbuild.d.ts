import type { DepOptimizationOptions } from 'vite';
export type EsbuildOptions = NonNullable<DepOptimizationOptions['esbuildOptions']>;
export type EsbuildPlugin = NonNullable<EsbuildOptions['plugins']>[number];
