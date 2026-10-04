# CLI-first Node app

A minimal Node.js application where the CLI is ready on day one. Clone it, build a feature, update the OpenAPI contract, and test the result through the generated `appctl` CLI.

## Start

Requires Node.js 24+, pnpm 10+, and Go 1.26+.

```sh
pnpm install
pnpm test
pnpm dev
```

`pnpm test` builds and runs the checked-in CLI. After OpenAPI or CLI identity changes, use `pnpm check` instead so generation stays in sync.

In another terminal:

```sh
./bin/appctl search "create task" --json
./bin/appctl commands show tasks create --json
./bin/appctl tasks create --set title="Ship from the CLI" -o json
./bin/appctl tasks list -o json
```

## Build features

The feature-development loop is one command:

```sh
pnpm check
```

It regenerates the CLI from `openapi/openapi.yaml`, builds `bin/appctl`, starts the application in-process, and runs the acceptance suite (CLI for API behavior, direct HTTP for transport-level boundary checks).

`pnpm test` only builds and tests the checked-in generated CLI. It does not run code generation or `go mod tidy`.

When an API feature changes:

1. Change `src/`.
2. Change `openapi/openapi.yaml`.
3. Run `pnpm check`.
4. Commit the regenerated `internal/generated/` and `skills/appctl/` output with the feature.

## What is included

- Dependency-free Node.js HTTP application
- OpenAPI 3.0 contract
- Reproducible generated CLI configuration
- Agent operating contract in `AGENTS.md`
- CLI-first acceptance suite
- CI guard against stale generated output

The CLI generation pipeline uses [Lathe](https://github.com/lathe-cli/lathe), pinned by version. Application developers do not need to modify the generator.
