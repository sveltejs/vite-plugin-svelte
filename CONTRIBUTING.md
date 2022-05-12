# Contributing to vite-plugin-svelte

vite-plugin-svelte connects two awesome frontend technologies to help us provide great things.

- [Svelte](https://svelte.dev/) is a new way to build web applications. It's a compiler that takes your declarative components and converts them into efficient JavaScript that surgically updates the DOM.
- [Vite](https://vitejs.dev/) is a new breed of frontend build tool that significantly improves the frontend development experience.

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals, communities, and companies. These resources help people who want to learn how to run and contribute to open source projects. Contributors and people new to open source alike will find the following guides especially useful:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)

## Get involved

There are many ways to contribute to Svelte, and many of them do not involve writing any code. Here's a few ideas to get started:

- Simply start using vite-plugin-svelte. Does everything work as expected? If not, we're always looking for improvements. Let us know by [opening an issue](#reporting-new-issues).
- Look through the [open issues](https://github.com/sveltejs/vite-plugin-svelte/issues). Provide workarounds, ask for clarification, or suggest labels. Help [triage issues](#triaging-issues-and-pull-requests).
- If you find an issue you would like to fix, [open a pull request](#your-first-pull-request).
- Read through our [documentation](https://github.com/sveltejs/vite-plugin-svelte/tree/main/docs). If you find anything that is confusing or can be improved, open a pull request.
- Take a look at the [features requested](https://github.com/sveltejs/vite-plugin-svelte/labels/enhancement) by others in the community and consider opening a pull request if you see something you want to work on.

Contributions are very welcome. If you think you need help planning your contribution, please ping us on Discord at [svelte.dev/chat](https://svelte.dev/chat) and let us know you are looking for a bit of help.

### Triaging issues and pull requests

One great way you can contribute to the project without writing any code is to help triage issues and pull requests as they come in.

- Ask for more information if you believe the issue does not provide all the details required to solve it.
- Suggest [labels](https://github.com/sveltejs/vite-plugin-svelte/labels) that can help categorize issues.
- Flag issues that are stale or that should be closed.
- Ask for test plans and review code.

## Bugs

We use [GitHub issues](https://github.com/sveltejs/vite-plugin-svelte/issues) for our public bugs. If you would like to report a problem, take a look around and see if someone already opened an issue about it. If you are certain this is a new unreported bug, you can submit a [bug report](#reporting-new-issues).

If you have questions about using Svelte, contact us on Discord at [svelte.dev/chat](https://svelte.dev/chat), and we will do our best to answer your questions.

If you see anything you'd like to be implemented, create a [feature request issue](https://github.com/sveltejs/vite-plugin-svelte/issues/new?template=feature_request.md)

## Reporting new issues

When [opening a new issue](https://github.com/sveltejs/svelte/issues/new/new?template=bug_report.md), always make sure to fill out the issue template. **This step is very important!** Not doing so may result in your issue not being managed in a timely fashion. Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

- **One issue, one bug:** Please report a single bug per issue.
- **Provide reproduction steps:** List all the steps necessary to reproduce the issue. The person reading your bug report should be able to follow these steps to reproduce your issue with minimal effort.

## Installation

1. This monorepo uses [pnpm](https://pnpm.js.org/en/). Install it with `npm i -g pnpm`
1. After cloning the repo run `pnpm install` to install dependencies
1. run `pnpm dev` to build vite-plugin-svelte in watch mode
1. run `pnpm dev` in `packages/playground/xxx` to start vite

## Pull requests

### Your first pull request

So you have decided to contribute code back to upstream by opening a pull request. You've invested a good chunk of time, and we appreciate it. We will do our best to work with you and get the PR looked at.

Working on your first Pull Request? You can learn how from this free video series:

[**How to Contribute to an Open Source Project on GitHub**](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

### Proposing a change

If you would like to request a new feature or enhancement but are not yet thinking about opening a pull request, you can also file an issue with [feature template](https://github.com/sveltejs/vite-plugin-svelte/issues/new?template=feature_request.md).

If you're only fixing a bug, it's fine to submit a pull request right away but we still recommend that you file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.

### Sending a pull request

Small pull requests are much easier to review and more likely to get merged. Make sure the PR does only one thing, otherwise please split it.

Please make sure the following is done when submitting a pull request:

1. Fork [the repository](https://github.com/sveltejs/vite-plugin-svelte) and create your branch from `main`.
1. Describe your **test plan** in your pull request description. Make sure to test your changes.
1. Make sure your code lints (`pnpm lint`).
1. Make sure your tests pass (`pnpm test`).

All pull requests should be opened against the `main` branch.

#### Tests

Integration tests for new features or regression tests as part of a bug fix are very welcome.
Add them to projects in `packages/e2e-tests`.

#### Documentation

If you've changed APIs, update the documentation.

#### Changelogs

For changes to be reflected in package changelogs, run `pnpm changeset` and follow the prompts.
You should always select the packages you've changed, Most likely `@sveltejs/vite-plugin-svelte`.

### What happens next?

The core Svelte team will be monitoring for pull requests. Do help us by making your pull request easy to review by following the guidelines above.

## Style guide

[Eslint](https://eslint.org) will catch most styling issues that may exist in your code. You can check the status of your code styling by simply running `pnpm lint`.

## License

By contributing to vite-plugin-svelte, you agree that your contributions will be licensed under its [MIT license](https://github.com/sveltejs/vite-plugin-svelte/blob/main/LICENSE).
