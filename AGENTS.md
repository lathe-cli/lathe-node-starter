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

## Scope

- Keep the Node application dependency-free until a concrete requirement needs a package.
- Keep `cli.yaml` as the CLI identity source; `pnpm cli:sync` copies it into the embedded Go entrypoint.
- Treat generated output as reproducible build output backed by the OpenAPI contract.
- Keep changes small. Do not add framework, database, authentication, deployment, or compatibility scaffolding without an explicit requirement.
