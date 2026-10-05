<script lang="ts">
	import Dummy from './Dummy.svelte';
	import raw from './Dummy.svelte?raw';
</script>

<main>
	<h1>Component</h1>
	<div id="component"><Dummy name="dummy" /></div>
	<h1>raw</h1>
	<pre id="raw">{raw}</pre>
</main>
