# Dataverse Capacity MCP Server

A **Model Context Protocol (MCP) server** that exposes the Dataverse capacity calculation engine as tools any AI agent can call.

Built from the same deterministic engine that powers the [interactive calculator](https://jukkan.github.io/dataverse-capacity/), so results are identical to what you see on the website.

---

## Tools

| Tool | Description |
|---|---|
| `list_skus` | Discover all license SKU IDs, their names, default capacity, and per-unit accrual values. Filter by product family. |
| `calculate_capacity` | Given a list of `{skuId, count}` pairs plus optional add-ons, returns total tenant-pool Dataverse DB and File capacity with a full breakdown. |

### Example agent conversation

> **User:** "How much Dataverse capacity does a tenant with 50 Dynamics 365 Sales Enterprise and 100 Power Apps Premium licenses get?"

1. Agent calls `list_skus` (or already knows the IDs)  
2. Agent calls `calculate_capacity` with `licenses: [{skuId: "sales-ent", count: 50}, {skuId: "pa-premium", count: 100}]`  
3. Gets back: **72.5 GB database, 340 GB file storage** — with a line-by-line breakdown

---

## Prerequisites

- Node.js 18 or later

## Install

```bash
cd mcp-server
npm install
```

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

Run as an HTTP server by swapping the transport in `src/index.js` from `StdioServerTransport` to `StreamableHTTPServerTransport` (from `@modelcontextprotocol/sdk/server/streamableHttp.js`). Deploy to Vercel, Azure Container Apps, or any Node.js host. Then create a Power Platform custom connector pointing at the `/mcp` endpoint.

---

## Capacity rules implemented

- **Default capacity** — max of all eligible SKUs licensed (not additive across SKUs)
- **Per-unit accrual** — per user/app/pack/bot, capped per-SKU where Microsoft specifies (e.g. Process Mining DB capped at 100 GB)
- **Attach licenses** — no accrual (Customer Insights attach = same default as base, still no accrual)
- **Capacity add-ons** — 1 GB increments, tenant-pooled
- **Pay-as-you-go environments** — 1 GB DB + 1 GB File each, independent of tenant pool

Data reflects the **December 2025 Power Platform and Dynamics 365 Licensing Guides** with the April 2026 Sales Premium update (MC1253515).
