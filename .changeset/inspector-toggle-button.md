---
'@sveltejs/vite-plugin-svelte': patch
---

fix(inspector): make the toggle button work again (when `showToggleButton: 'always'` )

Clicking the toggle button bubbled up to the `svelte:window` click handler, which calls `disable()` and immediately cancelled the `enable()` performed by `toggle()`. Once enabled, the capture-phase click listener that opens the editor also swallowed clicks on the toggle. With `showToggleButton: 'always'` the button was therefore unresponsive.
