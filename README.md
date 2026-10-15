# sew-microfrontends-astro

The [sew-microfrontends](https://github.com/ftischler/sew-microfrontends) use case on
[Astro](https://astro.build) with Angular islands via
[@analogjs/astro-angular](https://analogjs.org/docs/packages/astro-angular/overview).

| Page      | Content                                                                                     |
| --------- | ------------------------------------------------------------------------------------------- |
| `/`       | Static Astro page, no JavaScript                                                            |
| `/mfe1`   | Angular 22 island, hydrated with `client:visible`                                           |
| `/mfe2`   | Angular 22 island, hydrated with `client:visible`                                           |
| `/mfe3/*` | [mfe3](https://github.com/ftischler/sew-microfrontends-mfe3), Angular 21, loaded at runtime |

```sh
pnpm install
pnpm dev     # http://localhost:4321
pnpm check   # astro check and tools typecheck
pnpm test
pnpm build
```

mfe3 has to run on port 4203 (`pnpm start` in its repo) to show up on `/mfe3`.

## How it is composed

Astro owns routing: every page is its own URL and its own HTML document. Each
Angular island is bootstrapped as a separate zoneless Angular application, so islands
share the Angular bundle of this build but no state.

mfe1 and mfe2 live in `src/microfrontends` and are composed at build time.

mfe3 lives in another repo and is composed at runtime. `public/federation.manifest.json`
maps it to its `remoteEntry.json`, which is the same manifest format the Nx shell uses.
`<remote-island>` (`src/remotes/remote-island.ts`) reads the manifest and the
remoteEntry, imports the exposed module, registers `<sew-mfe3>` and passes the sub path
below `/mfe3` to it. It turns `mfe3-navigate` events into `history.pushState`, so the
host stays the only owner of the URL. No Native Federation runtime is needed in the
host.

The contract of each remote is configured in `src/remotes/remotes.ts`. Its `paths` are
pre-rendered, so deep links work on static hosting.

## Safety nets

**Only self-contained remotes are accepted.** Islands have no shared runtime to offer,
so a remote whose remoteEntry lists shared packages is rejected instead of being run
against packages that are not there.

**A broken remote only breaks its own island.** If a remote cannot be loaded, the
island shows a fallback with "Try again", which loads the remote again without a page
reload.

**Check remotes before deployment.** `pnpm remotes:check` verifies that every remote in
the manifest is reachable, self-contained and exposes the configured module:

```sh
pnpm remotes:check --manifest https://<env>/federation.manifest.json
```
