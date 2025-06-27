# Advanced usage

> **HERE BE DRAGONS**
>
> The features described here are not meant to be used in regular libraries or end-user applications.
> They can be useful for frameworks, documentation sites or in special situations, but you are responsible for applying them correctly.
>
> **Proceed with caution!**

## transform svelte files with vite plugins

vite-plugin-svelte uses 2 Vite plugins `vite-plugin-svelte:preprocess` and `vite-plugin-svelte:compile` to preprocess and compile input.
The preprocess plugin uses `enforce: pre` but the compile plugin does not, giving you fine-grained control to add your own transforms

```js
function mySvelteTransform() {
  const plugin = {
    name: 'vite-plugin-my-svelte-transformer',
    configResolved(c) {
      // optional, use the exact same id filter as vite-plugin-svelte itself
      const svelteIdFilter = c.plugins.find((p) => p.name === 'vite-plugin-svelte:config').api
        .idFilter;
      plugin.transform.filter.id = svelteIdFilter;
    },
    transform: {
      // if you don't use vite-plugin-svelte's filter make sure to include your own here
      filter: { id: /your id filter here/ },
      async handler(code, id) {
        const s = new MagicString(code);
        // do your transforms with s
        return {
          code: s.toString(),
          map: s.generateMap({ hires: 'boundary', includeContent: false })
        };
      }
    }
  };
  // To add your transform in the correct place use `enforce` and `transform.order`

  // before preprocess
  plugin.enforce = 'pre';
  plugin.transform.order = 'pre';

  // after preprocess but before compile
  plugin.transform.order = 'pre'; // leave plugin.enforce undefined

  // after compile
  plugin.transform.order = 'post'; // leave plugin.enforce undefined

  return plugin;
}
```

## custom queries

Vite supports using query parameters to request different outcomes for the same file.

The following schemes are supported by vite-plugin-svelte:

### raw

```js
//get .svelte file content as a string
import content from 'File.svelte?raw';
```

### experimental

In addition to the plain .svelte source content, you can use special svelte queries.

> These svelte subqueries are experimental, availability, syntax and output format may change

#### raw&svelte

```js
//get output of svelte.preprocess code as string
import preprocessed from 'File.svelte?raw&svelte&type=preprocessed';
```

```js
//get output of svelte.compile js.code as string
import script from 'File.svelte?raw&svelte&type=script';
```

```js
//get output of svelte.compile css.code as string
import style from 'File.svelte?raw&svelte&type=style';
```

##### detail exports

raw&svelte exports code string as default export, but also offers named exports if you need details

```js
//get output of svelte.preprocess
import { code, map, dependencies } from 'File.svelte?raw&svelte&type=preprocessed';
```

```js
//get output of svelte.compile js
import { code, map, dependencies } from 'File.svelte?raw&svelte&type=script';
```

```js
//get output of svelte.compile css
import { code, map, dependencies } from 'File.svelte?raw&svelte&type=style';
```

```js
//get everything in one go
import * as all from 'File.svelte?raw&svelte&type=all';
import {
  source,
  preprocessed,
  dependencies,
  js,
  css,
  ast,
  normalizedFilename,
  ssr,
  lang,
  warnings,
  stats
} from 'File.svelte?raw&svelte&type=all';
```

#### direct&svelte

```html
<!-- load and execute component script -->
<script type="application/javascript" src="File.svelte?direct&svelte&type=script&lang.js" />
<!-- embed component style as css -->
<link rel="stylesheet" type="text/css" href="File.svelte?direct&svelte&type=style&lang.css" />
```

#### sourcemap

add `&sourcemap` to `?(raw|direct)&svelte&type=(script|style|all)` queries to include sourcemaps (inline for direct)

#### compilerOptions

?raw and ?direct use default compilerOptions, even if you have different values in your svelte.config.js:

```js
const compilerOptions = {
  dev: false,
  generate: 'client',
  css: 'external'
};
```

to get output with different compilerOptions, append them as json like this:

```js
//get ssr output of svelte.compile js as {code, map, dependencies}
import script from 'File.svelte?raw&svelte&type=script&compilerOptions={"generate":"server"}';
```

only a subset of compilerOptions is supported

- generate
- dev
- css
- customElement
- immutable
