// this is a barrel file reexporting multiple svelte components
// App.svelte imports Gold from here and
// we want to prevent the css of Magenta.svelte from being included in the final output

// using /*@__NO_SIDE_EFFECTS__*/ or /*@__PURE__*/ here
// leads to RollupError: Cannot read properties of null (reading 'type')
export { default as Gold } from './Gold.svelte';
export { default as Magenta } from './Magenta.svelte';
