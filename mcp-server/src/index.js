import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SKUS, SKU_MAP } from "./skus.js";
import { calculateCapacity } from "./calculator.js";

const server = new McpServer({
  name: "dataverse-capacity",
  version: "1.0.0",
});

// ── Tool: list_skus ──────────────────────────────────────────────────────────
// Lets an AI agent discover which license SKU IDs are valid before calling
// calculate_capacity.

server.tool(
  "list_skus",
  "List all Microsoft license SKUs that grant Dataverse capacity. " +
    "Returns the SKU id (use this in calculate_capacity), display name, product family, " +
    "default capacity granted per tenant, and per-unit accrual values. " +
    "Use this tool first to discover valid skuId values.",
  {
    family: z
      .enum([
        "Dynamics365",
        "PowerApps",
        "PowerAutomate",
        "CopilotStudio",
        "all",
      ])
      .optional()
      .default("all")
      .describe(
        "Filter by product family. Use 'all' (default) to return every SKU."
      ),
  },
  async ({ family }) => {
    const filtered =
      family === "all" ? SKUS : SKUS.filter((s) => s.family === family);

    const rows = filtered.map((s) => ({
      id: s.id,
      name: s.name,
      family: s.family,
      license_type: s.license_type,
      eligible_for_default: s.eligible_for_default,
      default_db_gb: s.default.db_gb,
      default_file_gb: s.default.file_gb,
      accrual_db_gb_per_unit: s.accrual.db_gb,
      accrual_file_gb_per_unit: s.accrual.file_gb,
      accrues_capacity: s.accrues_capacity,
      tenant_cap_db_gb: s.tenant_cap_db_gb ?? null,
      requires_base: s.requires_base ?? null,
      notes: buildNotes(s),
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sku_count: rows.length,
              capacity_data_as_of: "April 2026",
              skus: rows,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Tool: calculate_capacity ──────────────────────────────────────────────────
// The main calculation tool. Fully deterministic — same engine as the website.

server.tool(
  "calculate_capacity",
  "Calculate the total Dataverse capacity (database and file storage) a Microsoft tenant " +
    "is entitled to based on their license subscriptions and capacity add-ons. " +
    "Capacity is pooled at tenant level and shared across environments. " +
    "Returns total GB for database and file storage, broken down by source " +
    "(default, per-user accrual, per-app accrual, per-pack accrual, add-ons), " +
    "plus per-SKU detail. " +
    "Use list_skus to discover valid skuId values.",
  {
    licenses: z
      .array(
        z.object({
          skuId: z
            .string()
            .describe(
              "The license SKU identifier. Use list_skus to find valid values."
            ),
          count: z
            .number()
            .int()
            .positive()
            .describe(
              "Number of licenses (users, apps, bots, or packs depending on license_type)."
            ),
        })
      )
      .min(1)
      .describe("The licenses the tenant holds."),
    addons: z
      .object({
        db_gb: z
          .number()
          .nonnegative()
          .default(0)
          .describe("Dataverse Database add-on capacity purchased, in GB."),
        file_gb: z
          .number()
          .nonnegative()
          .default(0)
          .describe("Dataverse File add-on capacity purchased, in GB."),
      })
      .optional()
      .default({})
      .describe(
        "Separately purchased Dataverse capacity add-ons (1 GB increments)."
      ),
    payg_environments: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe(
        "Number of Power Platform pay-as-you-go environments using Dataverse meters. " +
          "Each gets 1 GB DB + 1 GB File independent of the tenant pool."
      ),
  },
  async ({ licenses, addons, payg_environments }) => {
    const result = calculateCapacity(
      { licenses, addons, paygEnvironments: payg_environments },
      SKU_MAP
    );

    // Build a human-friendly summary alongside the structured data
    const { tenant_pool, payg_environments: payg } = result;
    const summary = [
      `Tenant pool — Database: ${formatGb(tenant_pool.db_gb)}, File: ${formatGb(tenant_pool.file_gb)}`,
      `  • Default (highest eligible SKU): DB ${formatGb(tenant_pool.breakdown.default.db_gb)}, File ${formatGb(tenant_pool.breakdown.default.file_gb)}`,
      `  • Per-user accrual: DB ${formatGb(tenant_pool.breakdown.per_user_accrual.db_gb)}, File ${formatGb(tenant_pool.breakdown.per_user_accrual.file_gb)}`,
      `  • Per-app accrual:  DB ${formatGb(tenant_pool.breakdown.per_app_accrual.db_gb)}, File ${formatGb(tenant_pool.breakdown.per_app_accrual.file_gb)}`,
      `  • Per-pack accrual: DB ${formatGb(tenant_pool.breakdown.per_pack_accrual.db_gb)}, File ${formatGb(tenant_pool.breakdown.per_pack_accrual.file_gb)}`,
      `  • Add-ons:          DB ${formatGb(tenant_pool.breakdown.addons.db_gb)}, File ${formatGb(tenant_pool.breakdown.addons.file_gb)}`,
    ];

    if (payg.count > 0) {
      summary.push(
        `Pay-as-you-go environments: ${payg.count} × (1 GB DB + 1 GB File) = ${payg.db_gb_total} GB DB, ${payg.file_gb_total} GB File (NOT from tenant pool)`
      );
    }

    if (result.errors.length > 0) {
      summary.push("Warnings: " + result.errors.join("; "));
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              summary: summary.join("\n"),
              result,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatGb(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
  if (gb >= 100) return `${Math.round(gb)} GB`;
  return `${gb.toFixed(2)} GB`;
}

function buildNotes(sku) {
  const notes = [];
  if (!sku.eligible_for_default) notes.push("Does not set tenant default.");
  if (!sku.accrues_capacity) notes.push("Does not accrue extra capacity.");
  if (sku.tenant_cap_db_gb)
    notes.push(`DB accrual capped at ${sku.tenant_cap_db_gb} GB per tenant.`);
  if (sku.requires_base)
    notes.push(`Requires "${sku.requires_base}" base license to be active.`);
  if (sku.min_licenses)
    notes.push(`Minimum purchase: ${sku.min_licenses} licenses.`);
  return notes.join(" ") || null;
}

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
