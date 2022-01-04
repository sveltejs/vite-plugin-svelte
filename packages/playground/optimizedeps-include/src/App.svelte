<script>
	import { Route, router } from 'tinro';
</script>

<nav>
	<a href="/foo">To foo</a>
	<a href="/bar">To bar</a>
	<button on:click={() => router.goto('/bar')}>Go bar</button>
</nav>
<Route path="/foo"><h1>Foo route</h1></Route>
<Route path="/bar"><h1>Bar route</h1></Route>
<Route fallback><h1>Default route</h1></Route>

<pre>
	$router: {JSON.stringify($router, null, 2)}
</pre>
