import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { after, before, test } from "node:test";
import { promisify } from "node:util";

import { createApp } from "../src/app.mjs";

let server;
let hostname;
const run = promisify(execFile);

before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  hostname = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function cli(...args) {
  const { stdout } = await run("./bin/appctl", ["--hostname", hostname, ...args, "-o", "json"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });
  return stdout ? JSON.parse(stdout) : undefined;
}

async function cliFailure(...args) {
  try {
    await cli(...args);
  } catch (error) {
    return JSON.parse(error.stderr).error;
  }
  assert.fail("CLI command unexpectedly succeeded");
}

test("the generated CLI is the application acceptance surface", async () => {
  assert.deepEqual(await cli("health", "get"), { status: "ok" });

  const created = await cli("tasks", "create", "--set", "title=Ship from the CLI");
  assert.deepEqual(created, { id: "1", title: "Ship from the CLI", completed: false });

  assert.deepEqual(await cli("tasks", "list"), [created]);
  assert.deepEqual(await cli("tasks", "get", "--id", created.id), created);

  const updated = await cli("tasks", "update", "--id", created.id, "--set", "completed=true");
  assert.deepEqual(updated, { ...created, completed: true });

  await cli("tasks", "delete", "--id", created.id);
  assert.deepEqual(await cli("tasks", "list"), []);
});

test("the generated CLI surfaces API errors", async () => {
  assert.equal((await cliFailure("tasks", "create", "--set-str", "title=")).http.status, 400);
  assert.equal((await cliFailure("tasks", "get", "--id", "missing")).http.status, 404);

  const task = await cli("tasks", "create", "--set", "title=Keep the contract honest");
  assert.equal(
    (await cliFailure("tasks", "update", "--id", task.id, "--file", "test/empty.json")).http.status,
    400
  );
});

test("the HTTP boundary rejects unsupported input", async () => {
  const wrongMethod = await fetch(`${hostname}/tasks`, { method: "PUT" });
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "GET, POST");

  const wrongMediaType = await fetch(`${hostname}/tasks`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({ title: "not JSON according to the header" })
  });
  assert.equal(wrongMediaType.status, 400);
  assert.deepEqual(await wrongMediaType.json(), { error: "content-type must be application/json" });

  const oversized = await fetch(`${hostname}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "x".repeat(1_000_001) })
  });
  assert.equal(oversized.status, 400);
  assert.deepEqual(await oversized.json(), { error: "request body exceeds 1 MB" });

  const badId = await fetch(`${hostname}/tasks/%ZZ`);
  assert.equal(badId.status, 400);
  assert.deepEqual(await badId.json(), { error: "invalid task id" });
});
