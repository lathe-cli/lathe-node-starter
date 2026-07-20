import { createApp } from "./app.mjs";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

createApp().listen(port, "127.0.0.1", () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});

