<div id="test">red</div>
<div class="foo">magenta</div>

<style lang="scss">
	@import './foo';
	#test {
		& {
			color: red;
		}
	}
</style>
