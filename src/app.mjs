import { createServer } from "node:http";

function send(response, status, body, headers = {}) {
  if (status === 204) {
    response.writeHead(status).end();
    return;
  }

  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  if (request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new Error("content-type must be application/json");
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("request body exceeds 1 MB");
    chunks.push(chunk);
  }

  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!body || Array.isArray(body) || typeof body !== "object") {
    throw new Error("request body must be a JSON object");
  }
  return body;
}

export function createApp() {
  const tasks = new Map();
  let nextId = 1;

  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    if (request.method === "GET" && url.pathname === "/health") {
      send(response, 200, { status: "ok" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/tasks") {
      send(response, 200, [...tasks.values()]);
      return;
    }

    if (request.method === "POST" && url.pathname === "/tasks") {
      try {
        const body = await readJson(request);
        if (typeof body.title !== "string" || body.title.trim() === "") {
          send(response, 400, { error: "title is required" });
          return;
        }
        const task = { id: String(nextId++), title: body.title.trim(), completed: false };
        tasks.set(task.id, task);
        send(response, 201, task);
      } catch (error) {
        send(response, 400, { error: error.message });
      }
      return;
    }

    if (url.pathname === "/tasks") {
      send(response, 405, { error: "method not allowed" }, { allow: "GET, POST" });
      return;
    }

    const match = url.pathname.match(/^\/tasks\/([^/]+)$/);
    if (!match) {
      send(response, 404, { error: "not found" });
      return;
    }

    if (request.method !== "GET" && request.method !== "PATCH" && request.method !== "DELETE") {
      send(response, 405, { error: "method not allowed" }, { allow: "GET, PATCH, DELETE" });
      return;
    }

    let id;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      send(response, 400, { error: "invalid task id" });
      return;
    }
    const task = tasks.get(id);
    if (!task) {
      send(response, 404, { error: "task not found" });
      return;
    }

    if (request.method === "GET") {
      send(response, 200, task);
      return;
    }

    if (request.method === "PATCH") {
      try {
        const body = await readJson(request);
        if ("title" in body && (typeof body.title !== "string" || body.title.trim() === "")) {
          send(response, 400, { error: "title must be a non-empty string" });
          return;
        }
        if ("completed" in body && typeof body.completed !== "boolean") {
          send(response, 400, { error: "completed must be a boolean" });
          return;
        }
        if (!("title" in body) && !("completed" in body)) {
          send(response, 400, { error: "title or completed is required" });
          return;
        }
        if ("title" in body) task.title = body.title.trim();
        if ("completed" in body) task.completed = body.completed;
        send(response, 200, task);
      } catch (error) {
        send(response, 400, { error: error.message });
      }
      return;
    }

    if (request.method === "DELETE") {
      tasks.delete(id);
      send(response, 204);
      return;
    }
  });
}
