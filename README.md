# kiryuu-gauge

Gauge specs for Kiryuu. Language plugin and npm package are **gauge-ts 0.5.1**.

## Local setup

```bash
npm ci
node scripts/setup-ts-node-shim.js   # after every npm ci / npm install
gauge install ts -v 0.5.1            # plugin must match the npm package
gauge run specs/
```

There is no `postinstall` hook; the shim must be applied by hand (or by the Dockerfile, which runs the same script after `npm ci`).

The Dockerfile installs the Gauge **ts plugin** with `gauge install ts -v 0.5.1`. That plugin is a separate artifact from the `gauge-ts` **npm** package; `package-lock.json` only locks the latter. If the plugin is missing at runtime, `gauge run` installs whatever is latest, which may not match this shim.

Plugins are installed under `GAUGE_HOME=/opt/gauge`, not `$HOME/.gauge`. GitHub Actions container jobs set `HOME=/github/home` (an empty host mount), so a plugin baked into `/root/.gauge` during `docker build` is not visible at `docker run`. Without `GAUGE_HOME`, Gauge then reports `Compatible version of plugin ts not found` and installs latest.

`npm run check-type` typechecks this repo with TypeScript 7.

## tsx shim vs gauge-ts compiler API (0.5.1)

These are two different uses of TypeScript. They do not replace each other.

### 1. The tsx shim — *run* the process

The Gauge **ts 0.5.1 plugin** launcher starts the runner with:

```text
npx ts-node --esm [-r tsconfig-paths/register] -e "import { start } from 'gauge-ts/dist/RunnerServer'; start();"
```

(`npx` is the default `GAUGE_TS_PACKAGE_RUNNER`; it still resolves `ts-node` from `node_modules/.bin`.)

That is an execution step: load `RunnerServer` and start the gRPC runner that Gauge talks to. The plugin still names this binary `ts-node`.

`ts-node` is unmaintained, so this repo does not depend on it as a runner. `scripts/setup-ts-node-shim.js` copies `scripts/ts-node-shim.js` over `node_modules/.bin/ts-node`. That file strips ts-node-only flags (`-O` / `--compiler-options`, and `--esm` which 0.5.1 always passes and which tsx/node reject) and execs `tsx` with the remaining args.

So: plugin says `ts-node` → shim → **tsx** actually transpiles and runs the entrypoint (and then your `tests/*.ts` when the runner loads them).

### 2. The compiler API — *parse* step implementations

Once that process is up, the **gauge-ts 0.5.1 npm package** reads `tests/*.ts` as text and walks the AST to find `@Step(...)` methods (`createSourceFile`, `forEachChild`, `isMethodDeclaration`, `getDecorators`, …). That registry is what Gauge validate/run uses to match spec steps to functions.

That work is `require("typescript")` inside `gauge-ts`. It is not done by tsx, and swapping the launcher to tsx does not change it.

`gauge-ts@0.5.1` depends on `"typescript": "^5.4.5"`, so npm installs TypeScript **5.x** under `node_modules/gauge-ts/`. This project's `"typescript": "^7.0.2"` is only for `tsc` / `check-type`.

0.5.1 uses TC39 Stage 3 decorators, so this repo's `tsconfig.json` does **not** set `experimentalDecorators` (target is `es2020`).
