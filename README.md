# kiryuu-gauge

Gauge specs for Kiryuu. Language plugin and npm package are **gauge-ts 0.3.4**.

## Local setup

```bash
npm ci
node scripts/setup-ts-node-shim.js   # after every npm ci / npm install
gauge run specs/
```

There is no `postinstall` hook; the shim must be applied by hand (or by the Dockerfile, which runs the same script after `npm ci`).

The Dockerfile installs the Gauge **ts plugin** with `gauge install ts -v 0.3.4`. That plugin is a separate artifact from the `gauge-ts` **npm** package; `package-lock.json` only locks the latter. If the plugin is missing at runtime, `gauge run` installs the latest plugin (0.5.1 as of this writing), whose launcher is not the 0.3.4 `npx ts-node` entry this shim is written for.

Plugins are installed under `GAUGE_HOME=/opt/gauge`, not `$HOME/.gauge`. GitHub Actions container jobs set `HOME=/github/home` (an empty host mount), so a plugin baked into `/root/.gauge` during `docker build` is not visible at `docker run`. Without `GAUGE_HOME`, Gauge then reports `Compatible version of plugin ts not found` and installs 0.5.1.

`npm run check-type` typechecks this repo with TypeScript 7.

## tsx shim vs gauge-ts compiler API (0.3.4)

These are two different uses of TypeScript. They do not replace each other.

### 1. The tsx shim — *run* the process

The Gauge **ts 0.3.4 plugin** launcher starts the runner with:

```text
npx ts-node [-r tsconfig-paths/register] -e "import { start } from 'gauge-ts/dist/RunnerServer'; start();"
```

That is an execution step: load `RunnerServer` and start the gRPC runner that Gauge talks to. The plugin still names this binary `ts-node`.

`ts-node` is unmaintained, so this repo does not depend on it as a runner. `scripts/setup-ts-node-shim.js` copies `scripts/ts-node-shim.js` over `node_modules/.bin/ts-node`. That file strips ts-node-only flags (`-O` / `--compiler-options`) and execs `tsx` with the remaining args.

So: plugin says `ts-node` → shim → **tsx** actually transpiles and runs the entrypoint (and then your `tests/*.ts` when the runner loads them).

### 2. The compiler API — *parse* step implementations

Once that process is up, the **gauge-ts 0.3.4 npm package** reads `tests/*.ts` as text and walks the AST to find `@Step(...)` methods (`createSourceFile`, `forEachChild`, `isMethodDeclaration`, `getDecorators`, …). That registry is what Gauge validate/run uses to match spec steps to functions.

That work is `require("typescript")` inside `gauge-ts`. It is not done by tsx, and swapping the launcher to tsx does not change it.

`gauge-ts@0.3.4` depends on `"typescript": "^5.0.4"`, so npm installs TypeScript **5.6.x** under `node_modules/gauge-ts/`. This project's `"typescript": "^7.0.2"` is only for `tsc` / `check-type`.
