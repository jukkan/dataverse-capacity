import { createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createCapacityServer } from "./server.js";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);
const allowedHosts = parseCsvEnv(process.env.MCP_ALLOWED_HOSTS);
const allowedOrigins = parseCsvEnv(process.env.MCP_ALLOWED_ORIGINS);
const enableDnsRebindingProtection =
  allowedHosts.length > 0 || allowedOrigins.length > 0;

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        server: "dataverse-capacity",
        transport: "streamable-http",
        mode: "stateless-json",
      })
    );
    return;
  }

  if (url.pathname !== "/mcp") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    enableDnsRebindingProtection,
    allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : undefined,
  });
  const server = createCapacityServer();

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("HTTP MCP request failed.", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error.",
          },
          id: null,
        })
      );
    } else {
      res.end();
    }
  } finally {
    await server.close().catch(() => {});
  }
});

httpServer.listen(port, host, () => {
  console.error(
    `Dataverse Capacity MCP HTTP server listening on http://${host}:${port}`
  );
  if (enableDnsRebindingProtection) {
    console.error(
      `DNS rebinding protection enabled for hosts: ${allowedHosts.join(", ") || "(origin-only)"}`
    );
  }
});

function parseCsvEnv(value) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
