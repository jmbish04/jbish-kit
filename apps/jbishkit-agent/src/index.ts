import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { TaskSession } from "./durable-objects/TaskSession";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use("/*", cors());

// Health check
app.get("/", (c) => {
  return c.json({
    name: "JBishKit Agent",
    version: "0.1.0",
    status: "healthy",
  });
});

// WebSocket endpoint
app.get("/ws", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");

  if (upgradeHeader !== "websocket") {
    return c.text("Expected WebSocket", 426);
  }

  // Create WebSocket pair
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  // Create Durable Object session
  const id = c.env.TASK_SESSION.idFromName(`session-${crypto.randomUUID()}`);
  const stub = c.env.TASK_SESSION.get(id);

  // Forward the WebSocket to the Durable Object
  await stub.fetch(c.req.raw, {
    headers: {
      Upgrade: "websocket",
    },
  }).then((response) => {
    // @ts-ignore - WebSocket handling
    server.accept();
  });

  return new Response(null, {
    status: 101,
    // @ts-ignore - WebSocket upgrade
    webSocket: client,
  });
});

// Preview endpoint (for dev server pass-through)
app.get("/preview/:id/*", async (c) => {
  const previewId = c.req.param("id");
  const path = c.req.param("*");

  // Get port mapping from KV
  const port = await c.env.PREVIEW_MAPPINGS.get(previewId);

  if (!port) {
    return c.text("Preview not found", 404);
  }

  // Proxy to dev server running in sandbox
  // Note: This is a simplified version. In production, you'd need proper proxying
  return c.text(`Preview ${previewId} - Path: ${path} - Port: ${port}`);
});

export default app;

// Export Durable Object
export { TaskSession };
