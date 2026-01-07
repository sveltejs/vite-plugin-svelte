<scrip>let js_variable = "JS_VARIABLE_1";</scrip>

<span class="apple">{js_variable}</span>

<style>
	:root {
		--css_variable: 'CSS_VARIABLE_1';
	}
	.apple:before {
		content: var(--css_variable);
	}
</style>
