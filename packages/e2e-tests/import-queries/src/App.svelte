<script lang="ts">
	import Dummy from './Dummy.svelte';
	import raw from './Dummy.svelte?raw';
	import preprocessed from './Dummy.svelte?raw&svelte&type=preprocessed';
	import script from './Dummy.svelte?raw&svelte&type=script';
	import wcScript from './Dummy.svelte?raw&svelte&type=script&compilerOptions={"customElement":true,"dev":false}';
	import style from './Dummy.svelte?raw&svelte&type=style';
	import all from './Dummy.svelte?raw&svelte&type=all&sourcemap';
</script>

<main>
	<h1>raw</h1>
	<pre id="raw">{raw}</pre>
	<h1>preprocessed</h1>
	<pre id="preprocessed">{preprocessed.code}</pre>
	<h1>script</h1>
	<pre id="script">{script.code}</pre>
	<h1>web component script</h1>
	<pre id="wcScript">{wcScript.code}</pre>
	<h1>style</h1>
	<pre id="style">{style.code}</pre>
	<h1>all</h1>
	<pre id="all">{JSON.stringify(all)}</pre>
	<h1>Component</h1>
	<div id="component"><Dummy name="dummy" /></div>
</main>
