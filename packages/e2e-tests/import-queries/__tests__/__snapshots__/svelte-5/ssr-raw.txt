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
	@use 'sass:color';
	$blue: blue;
	button {
		color: color.adjust($blue, $lightness: -20%);
	}
</style>
