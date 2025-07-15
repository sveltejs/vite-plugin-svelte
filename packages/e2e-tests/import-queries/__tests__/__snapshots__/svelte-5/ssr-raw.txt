<script lang="ts">
	interface Props {
		name: string;
	}

	let { name }: Props = $props();
	let clicks = $state(0);
</script>

<button
	onclick={() => {
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
