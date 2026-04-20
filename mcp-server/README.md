# Dataverse Capacity MCP Server

A **Model Context Protocol (MCP) server** that exposes the Dataverse capacity calculation engine as tools any AI agent can call.

Built from the same deterministic engine that powers the [interactive calculator](https://jukkan.github.io/dataverse-capacity/), so results are identical to what you see on the website.

---

## Tools

| Tool | Description |
|---|---|
| `list_skus` | Discover all license SKU IDs, their names, default capacity, and per-unit accrual values. Optional family filter. |
| `calculate_capacity` | Full-fidelity calculation tool using structured nested inputs such as `licenses`, `addons`, and `payg_environments`. |
| `calculate_capacity_simple` | Compatibility wrapper for MCP clients that struggle with nested JSON Schema inputs. Accepts `licenses_json` plus flat numeric inputs, but uses the same calculation engine and returns the same result shape. |

### Example agent conversation

> **User:** "How much Dataverse capacity does a tenant with 50 Dynamics 365 Sales Enterprise and 100 Power Apps Premium licenses get?"

1. Agent calls `list_skus` (or already knows the IDs)  
2. Agent calls `calculate_capacity` with `licenses: [{skuId: "sales-ent", count: 50}, {skuId: "pa-premium", count: 100}]`  
3. Gets back: **67.5 GB database, 340 GB file storage** — with a line-by-line breakdown

### Compatibility note

The server exposes both:

- the full structured tool surface for MCP clients that handle nested JSON Schema cleanly
- a Copilot-friendly compatibility tool for clients that connect successfully but fail to execute tools with richer nested schemas

This is an intentional compatibility layer, not a replacement of the core API surface. The goal is to preserve the richer contract for capable clients such as Codex and Claude while providing a flat-input fallback for clients such as Copilot Studio when needed.

---

## Prerequisites

- Node.js 18 or later

## Install

```bash
cd mcp-server
npm install
```

The package exposes two entrypoints:

- `npm start` for local `stdio` clients like VS Code MCP and Claude Desktop
- `npm run start:http` for remote Streamable HTTP deployment behind a reverse proxy

## Implementation

The server is split by transport so the same tool logic can be reused in desktop and hosted scenarios:

- `src/server.js` creates the MCP server instance and registers the tools
- `src/index.js` exposes the `stdio` transport for local MCP clients
- `src/http.js` exposes a stateless Streamable HTTP transport for remote deployment
- `src/calculator.js` contains the shared Dataverse capacity calculation engine
- `src/skus.js` contains the SKU catalog and entitlement metadata

This separation matters because the calculator logic should stay transport-agnostic. The web app, local MCP usage, and hosted MCP usage can all share the same underlying rules instead of reimplementing them in different layers

The compatibility tool lives in the same MCP server and calls the same `calculateCapacity(...)` engine. That keeps the numeric logic identical across:

- the website
- Codex and Claude using `calculate_capacity`
- compatibility-constrained clients using `calculate_capacity_simple`

---

## Wire up to an AI client

### VS Code / GitHub Copilot

Add to your workspace or user `mcp.json` (`.vscode/mcp.json` or `%APPDATA%\Code\User\mcp.json`):

```json
{
  "servers": {
    "dataverse-capacity": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/src/index.js"]
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "dataverse-capacity": {
      "command": "node",
      "args": ["C:/path/to/dataverse-capacity/mcp-server/src/index.js"]
    }
  }
}
```

### Copilot Studio / any HTTP client

Run the dedicated HTTP entrypoint:

```bash
cd mcp-server
npm run start:http
```

Default listener:

- MCP endpoint: `http://127.0.0.1:3000/mcp`
- Copilot MCP endpoint: `http://127.0.0.1:3000/copilot-mcp`
- Health endpoint: `http://127.0.0.1:3000/health`

Optional environment variables:

- `HOST` defaults to `127.0.0.1`
- `PORT` defaults to `3000`
- `MCP_ALLOWED_HOSTS` comma-separated allowlist for Host header validation
- `MCP_ALLOWED_ORIGINS` comma-separated allowlist for Origin header validation

The HTTP server runs in stateless Streamable HTTP mode with JSON responses enabled, which is a better fit for a lightweight public calculation service than a desktop-only `stdio` transport.

For a reverse-proxied deployment, publish only the MCP paths you intend to use plus `/health`, keep the Node listener bound to localhost, and let Nginx terminate TLS in front of it.

## Copilot Studio compatibility

Some MCP clients handle nested tool schemas better than others. To avoid weakening the core API surface just because one client is more limited, this server keeps:

- `/mcp` as the full MCP profile, including the richer `calculate_capacity` contract
- `/copilot-mcp` as the compatibility profile, publishing only the simpler tools Copilot Studio is more likely to ingest cleanly

Current profile intent:

- `/mcp`: `list_skus`, `calculate_capacity`, `calculate_capacity_simple`
- `/copilot-mcp`: `list_skus`, `calculate_capacity_simple`

`calculate_capacity_simple` takes:

- `licenses_json` as a JSON string
- `db_addon_gb`
- `file_addon_gb`
- `payg_environments`

Example:

```json
{
  "licenses_json": "[{\"skuId\":\"pa-premium\",\"count\":150},{\"skuId\":\"sales-ent\",\"count\":40}]",
  "db_addon_gb": 10,
  "file_addon_gb": 20,
  "payg_environments": 3
}
```

Use this tool only when the MCP client fails to execute the richer nested input schema. The returned calculation output stays aligned with the full tool because both paths use the same engine.

## Self-hosting

You can deploy this MCP server on any Linux host with Node 18+ and a reverse proxy such as Nginx or Caddy.

Recommended pattern:

1. Copy the `mcp-server/` folder to the target machine
2. Run `npm ci`
3. Start the HTTP transport with `npm run start:http`
4. Bind Node to localhost only
5. Publish only `/health` and `/mcp` through the reverse proxy
6. Terminate TLS at the reverse proxy
7. Add a Host allowlist with `MCP_ALLOWED_HOSTS`

Example environment:

```bash
HOST=127.0.0.1
PORT=3000
MCP_ALLOWED_HOSTS=mcp.example.com
npm run start:http
```

Example Nginx location blocks:

```nginx
location = /health {
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3000/health;
}

location = /mcp {
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_pass http://127.0.0.1:3000/mcp;
}
```

Smoke test after deployment:

```bash
curl https://mcp.example.com/health

curl -X POST https://mcp.example.com/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-03-26",
      "capabilities":{},
      "clientInfo":{"name":"smoke-test","version":"1.0.0"}
    }
  }'
```

This repo intentionally documents the generic deployment pattern rather than one specific production host. Infrastructure-specific service names, directories, certificates, and host-level operational details should stay in the operator's own project notes.

---

## Capacity rules implemented

- **Default capacity** — max of all eligible SKUs licensed (not additive across SKUs)
- **Per-unit accrual** — per user/app/pack/bot, capped per-SKU where Microsoft specifies (e.g. Process Mining DB capped at 100 GB)
- **Attach licenses** — no accrual (Customer Insights attach = same default as base, still no accrual)
- **Capacity add-ons** — 1 GB increments, tenant-pooled
- **Pay-as-you-go environments** — 1 GB DB + 1 GB File each, independent of tenant pool

Data reflects the **December 2025 Power Platform and Dynamics 365 Licensing Guides** with the April 2026 Sales Premium update (MC1253515).
