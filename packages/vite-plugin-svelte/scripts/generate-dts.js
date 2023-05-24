import { createBundle } from 'dts-buddy';

await createBundle({
	output: 'types/index.d.ts',
	modules: {
		'@sveltejs/vite-plugin-svelte': 'src/public.d.ts'
	}
});
