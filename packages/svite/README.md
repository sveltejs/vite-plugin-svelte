# svite

This is the new svite for vite2. It is still a work in progress. Feedback is welcome

Currently there is only one command for the cli to create new projects from templates.
Unlike svite 0.8, it does not initialize git or install anything

## get started

```shell
npx svite create my-svite-project
cd my-svite-project
npm install
npm run dev
npm run build
```

## cli

```shell
svite --help
svite create --help
svite create my-svite-project
```

### svite create

```
Usage:
  $ svite create [targetDir]

Options:
  --t, --template <string>  template for new project. ["minimal","routify-mdsvex","windicss","preprocess-auto"] (default: minimal)
  --ts, --typescript        enable typescript support for svelte (default: false)
  -f, --force               force operation even if targetDir exists and is not empty (default: false)
  -d, --debug               more verbose logging (default: false)
  -h, --help                Display this message
  -v, --version             Display version number
```

# Migration from 0.8

- install vite@2 and @svitejs/vite-plugin-svelte
- Update vite.config.js
  - use the pattern described in the [readme](packages/vite-plugin-svelte/README.md) of the new vite-plugin-svelte
  - remove old svite options
  - read vite2 documentation on https://vitejs.dev
  - add any svelte library you use to `optimizeDeps.exclude=[]` in vite.config
- remove svite from dependencies
- update package.json scripts to use `vite dev` and `vite build` instead of `svite dev` and `svite build`

# TODO more docs
