# Inspector

`@sveltejs/vite-plugin-svelte-inspector` is a Vite plugin that adds a Svelte inspector in the browser. It shows the file location where the element under cursor is defined and you can click to quickly open your code editor at this location.

Note that `@sveltejs/vite-plugin-svelte` needs to be installed as a peer dependency as the inspector brings in Svelte components to be compiled.

## Setup

### with Svelte config

```js
// svelte.config.js
export default {
  vitePlugin: {
    // set to true for defaults or customize with object
    inspector: {
      toggleKeyCombo: 'meta-shift',
      showToggleButton: 'always',
      toggleButtonPos: 'bottom-right'
    }
  }
};
```

### with environment variables

Svelte Inspector toggle keys and other options are personal preferences. As such it isn't always convenient to define them in a shared svelte config file.
To allow you to use your own setup, svelte inspector can be configured via environment variables, both from shell and dotenv files.

```shell
# just keycombo, unquoted string
SVELTE_INSPECTOR_TOGGLE=control-shift

# options object as json
SVELTE_INSPECTOR_OPTIONS='{"holdMode": false, "toggleButtonPos": "bottom-left"}'

# disable completely
SVELTE_INSPECTOR_OPTIONS=false

# force default options
SVELTE_INSPECTOR_OPTIONS=true
```

> Inspector options set on the environment take precedence over values set in svelte config and automatically enable svelte inspector during dev.

## Plugin options

### toggleKeyCombo

- **Type:** `string`
- **Default:** `'meta-shift'` on mac, `'control-shift'` on other os

  Define a key combo to toggle inspector.

  The value is recommended to be any number of modifiers (e.g. `control`, `shift`, `alt`, `meta`) followed by zero or one regular key, separated by `-`. This helps avoid conflicts or accidentally typing into inputs. Note that some keys have native behavior (e.g. `alt-s` opens history menu on firefox).

  Examples: `control-shift`, `control-o`, `control-alt-s`, `meta-x`, `control-meta`.

### navKeys

- **Type:** `{ parent: string; child: string; next: string; prev: string }`
- **Default:** `{ parent: 'ArrowUp', child: 'ArrowDown', next: 'ArrowRight', prev: 'ArrowLeft' }`

  Define keys to select elements with via keyboard. This improves accessibility and helps selecting elements that do not have a hoverable surface area due to tight wrapping.

  - `parent`: select closest parent
  - `child`: select first child (or grandchild)
  - `next`: next sibling (or parent if no next sibling exists)
  - `prev`: previous sibling (or parent if no prev sibling exists)

### openKey

- **Type:** `string`
- **Default:** `'Enter'`

  Define key to open the editor for the currently selected dom node.

### holdMode

- **Type:** `boolean`
- **Default:** `true`

  Inspector will only open when the `toggleKeyCombo` is held down, and close when released.

### showToggleButton

- **Type:** `'always' | 'active' | 'never'`
- **Default:** `'active'`

  When to show the toggle button. The toggle button allows you to click on-screen to enable/disable the inspector, rather than using the `toggleKeyCombo`.

  - `'always'`: always show the toggle button
  - `'active'`: show the toggle button when the inspector is active
  - `'never'`: never show the toggle button

### toggleButtonPos

- **Type:** `'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'`
- **Default:** `'top-right'`

  Where to display the toggle button.

### customStyles

- **Type:** `boolean`
- **Default:** `true`

  Inject custom styles when inspector is active. This is useful if you want to customize the inspector styles to match your app.

  When the inspector is active, the `svelte-inspector-enabled` class is added to the `body` element, and the `svelte-inspector-active-target` class is added to the current active target (e.g. via hover or keyboard).

## Editors

If your editor is not [supported out of the box](https://github.com/yyx990803/launch-editor#supported-editors), you can follow [the instructions here](https://github.com/yyx990803/launch-editor#custom-editor-support) to add it.
