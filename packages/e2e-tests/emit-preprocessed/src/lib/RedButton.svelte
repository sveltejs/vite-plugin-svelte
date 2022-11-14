<button on:click><slot>Click me</slot></button>

<style lang="scss">
	button {
		color: white;
		background-color: red;
		&:hover {
			color: red;
			background-color: white;
		}
	}
</style>
