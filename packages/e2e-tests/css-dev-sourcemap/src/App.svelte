<div id="test">red</div>
<div class="foo">magenta</div>

<style lang="scss">
	@use './foo';
	#test {
		& {
			color: red;
		}
	}
</style>
