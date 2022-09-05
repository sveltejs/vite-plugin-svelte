# read this first

This code is highly experimental and may never make it into an official plugin.
It explores what we envisioned on svelte radio https://www.svelteradio.com/episodes/inspecting-svelte-code-with-dominik-g

The goal is to provide inline editing directly in your dev page without context switching out of the browser into an external editor

# What is working

- clicking opens the file in a bottom toast overlay
- changing code in the overlay and clicking save/close

# TODO

- reduce code that can be edited to location (+- a few lines or enclosing tags?)
- maybe keep editor open after save
- nicer ux/ui in general. colors, animations, feedback on save etc
- true "inline" mode for static/raw text nodes (needs help from svelte ast to determine, use cache and loc to find it)
- add "open file in external editor" action button if user is unhappy with the provided snippet as an escape hatch
