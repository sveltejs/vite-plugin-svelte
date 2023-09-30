// this is a barrel file reexporting multiple svelte components
// App.svelte imports Gold from here and
// we want to prevent the css of Magenta.svelte from being included in the final output
export { default as Gold } from './Gold.svelte';
export { default as Magenta } from './Magenta.svelte';
