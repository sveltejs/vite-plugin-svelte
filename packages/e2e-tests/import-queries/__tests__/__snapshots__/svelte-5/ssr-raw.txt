<script lang="ts">
	export let name: string;
	let clicks = 0;
</script>

<button
	on:click={() => {
		clicks++;
	}}>{name} clicks: {clicks}</button
>

<style lang="scss">
	$blue: blue;
	button {
		color: darken($blue, 20);
	}
</style>
