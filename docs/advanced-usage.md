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
