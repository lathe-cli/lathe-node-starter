# Agent Development Contract

This repository is CLI-first. The generated `appctl` CLI is the primary acceptance surface for application behavior.

## Required loop

For every API-facing feature or behavior change:

1. Update the application code under `src/`.
2. Update `openapi/openapi.yaml` in the same change. It is the API contract and CLI source of truth.
3. Run `pnpm check`. This regenerates `appctl`, builds it, and runs the end-to-end suite through the CLI.
4. Commit the matching changes under `internal/generated/`, `skills/appctl/`, and `cmd/appctl/cli.yaml`.

Do not hand-edit generated files. Do not test API behavior only through direct HTTP calls; use direct HTTP only for transport-level boundary checks.

## Agent CLI loop

Before guessing a command or flag:

```sh
./bin/appctl search "<intent>" --json
./bin/appctl commands show <path...> --json
./bin/appctl <path...> -o json
```

Search returns candidates, not an execution contract. `commands show` is authoritative for method, path, flags, request body, and authentication requirements.

## Application versioning

Follow [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html), clauses 2, 3, 9, and 11, with these project conventions:

- Use the `X.Y.Z` core, where each component is a nonnegative integer without leading zeroes.
- Use only `X.Y.Z-alpha.N`, `X.Y.Z-beta.N`, or `X.Y.Z-rc.N` for prereleases. Start `N` at 1, without leading zeroes.
- Compare core components numerically, from left to right. For the same core, precedence is `alpha < beta < rc < final`.
- Compare `N` numerically. For example, `1.2.3-rc.2 < 1.2.3-rc.10 < 1.2.3`.
- Keep published contents and tags immutable. Release changes under a new version, without moving, reusing, renaming, or deleting published tags.
- Use `package.json` `version` as the application version source. At the tagged commit, `v<semver>` must equal that version after removing `v`.

Keep the generated `appctl` CLI in the application release unless it needs independent releases.
For an independently released `appctl` CLI, use the fixed `appctl-v<semver>` prefix and its Git tag as its version source.
Keep `v<semver>` for the application and keep the two version sequences separate.
For each additional independent artifact, document its version source and a distinct fixed tag prefix before its first release.
Keep tag prefixes out of version values. Keep build metadata and commit IDs separate from release versions.

## Scope

- Keep the Node application dependency-free until a concrete requirement needs a package.
- Keep `cli.yaml` as the CLI identity source; `pnpm cli:sync` copies it into the embedded Go entrypoint.
- Treat generated output as reproducible build output backed by the OpenAPI contract.
- Keep changes small. Do not add framework, database, authentication, deployment, or compatibility scaffolding without an explicit requirement.
