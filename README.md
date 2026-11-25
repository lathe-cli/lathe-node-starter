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

## Application versioning

This project follows [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html), clauses 2, 3, 9, and 11, with these conventions:

- The version core is `X.Y.Z`. Each component is a nonnegative integer without leading zeroes.
- Prereleases use only `X.Y.Z-alpha.N`, `X.Y.Z-beta.N`, or `X.Y.Z-rc.N`. The number `N` starts at 1, without leading zeroes.
- Core components compare numerically, from left to right. For the same core, precedence is `alpha < beta < rc < final`.
- Prerelease numbers compare numerically. For example, `1.2.3-rc.2 < 1.2.3-rc.10 < 1.2.3`.
- Published contents and tags are immutable. Release changes under a new version, without moving, reusing, renaming, or deleting published tags.
- The application version source is `package.json` `version`. At the tagged commit, `v<semver>` must equal that version after removing `v`.

Keep the generated `appctl` CLI in the application release unless it needs independent releases.
For an independently released `appctl` CLI, use the fixed `appctl-v<semver>` prefix and its Git tag as its version source.
Keep `v<semver>` for the application and keep the two version sequences separate.
For each additional independent artifact, document its version source and a distinct fixed tag prefix before its first release.
Tag prefixes are not part of version values. Keep build metadata and commit IDs separate from release versions.

## What is included

- Dependency-free Node.js HTTP application
- OpenAPI 3.0 contract
- Reproducible generated CLI configuration
- Agent operating contract in `AGENTS.md`
- CLI-first acceptance suite
- CI guard against stale generated output

The CLI generation pipeline uses [Lathe](https://github.com/lathe-cli/lathe), pinned by version. Application developers do not need to modify the generator.
