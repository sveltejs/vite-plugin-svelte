# Advanced usage

## custom queries

Vite supports using query parameters to request different outcomes for the same file.

The following schemes are supported by vite-plugin-svelte

### raw

```js
//get .svelte file content as a string
import content from 'File.svelte?raw';

//get output of svelte.preprocess as {code, map, dependencies}
import preprocessed from 'File.svelte?raw&svelte&type=preprocessed';

//get output of svelte.compile js as {code, map, dependencies}
import script from 'File.svelte?raw&svelte&type=script';

//get output of svelte.compile css as {code, map }
import style from 'File.svelte?raw&svelte&type=style';
```

### direct

```html
<!-- load and execute component script -->
<script type="application/javascript" src="File.svelte?direct&svelte&type=script&lang.js" />
<!-- embed component style as css -->
<link rel="stylesheet" type="text/css" href="File.svelte?direct&svelte&type=script&lang.css" />
```

### sourcemap

add `&sourcemap` to `?(raw|direct)&svelte&type=(script|style)` queries to include sourcemaps (inline for direct)

### compilerOptions

?raw and ?direct use default compilerOptions, even if you have different values in your svelte.config.js:

```js
const compilerOptions = {
  dev: false,
  generate: 'dom',
  css: false,
  hydratable: false,
  enableSourcemap: false // or {js: true} or {css:true} if sourcemap query is set
};
```

to get output with different compilerOptions, append them as json like this:

```js
//get ssr output of svelte.compile js as {code, map, dependencies}
import script from 'File.svelte?raw&svelte&type=script&compilerOptions={generate:"ssr"}';
```

only a subset of compilerOptions is supported

- generate
- dev
- css
- hydratable
- customElement
- immutable
- enableSourcemap
