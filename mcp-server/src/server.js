import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SKUS, SKU_MAP } from "./skus.js";
import { calculateCapacity } from "./calculator.js";

export function createCapacityServer(options = {}) {
  const profile = options.profile ?? "full";
  const server = new McpServer({
    name: profile === "copilot" ? "dataverse-capacity-copilot" : "dataverse-capacity",
    version: "1.0.0",
  });

  server.tool(
    "list_skus",
    "List all Microsoft license SKUs that grant Dataverse capacity. " +
      "Returns the SKU id (use this in calculate_capacity or calculate_capacity_simple), display name, product family, " +
      "default capacity granted per tenant, and per-unit accrual values. " +
      "Use this tool first to discover valid skuId values whenever product names are ambiguous.",
    {
      family: z
        .string()
        .optional()
        .describe(
          "Optional product family filter. Supported values are Dynamics365, PowerApps, PowerAutomate, CopilotStudio, or all. Leave blank to return every SKU."
        ),
    },
    async ({ family }) => {
      const normalizedFamily = normalizeFamily(family);
      const filtered =
        normalizedFamily === "all"
          ? SKUS
          : SKUS.filter((s) => s.family === normalizedFamily);

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

  if (profile !== "copilot") {
    server.tool(
      "calculate_capacity",
      "Calculate the total Dataverse capacity (database and file storage) a Microsoft tenant " +
        "is entitled to based on their license subscriptions and capacity add-ons. " +
        "Capacity is pooled at tenant level and shared across environments. " +
        "Returns total GB for database and file storage, broken down by source " +
        "(default, per-user accrual, per-app accrual, per-pack accrual, add-ons), " +
        "plus per-SKU detail. " +
        "Use list_skus to discover valid skuId values. " +
        "This is the full structured version for MCP clients that support nested JSON inputs cleanly.",
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

        return buildCalculationResponse(result);
      }
    );
  }

  server.tool(
    "calculate_capacity_simple",
    "Copilot-friendly compatibility wrapper for Dataverse capacity calculations. " +
      "Prefer this when an MCP client has trouble with nested JSON schemas or when using Copilot Studio. " +
      "Pass the license mix as a JSON string such as " +
      '[{"skuId":"pa-premium","count":150},{"skuId":"sales-ent","count":40}] ' +
      "and optionally pass add-on GB values and pay-as-you-go environment count. " +
      "This tool uses the same calculation engine as calculate_capacity.",
    {
      licenses_json: z
        .string()
        .describe(
          'JSON array of license objects, for example [{"skuId":"pa-premium","count":150},{"skuId":"sales-ent","count":40}].'
        ),
      db_addon_gb: z
        .number()
        .optional()
        .describe("Optional Dataverse Database add-on capacity purchased, in GB."),
      file_addon_gb: z
        .number()
        .optional()
        .describe("Optional Dataverse File add-on capacity purchased, in GB."),
      payg_environments: z
        .number()
        .int()
        .optional()
        .describe("Optional number of Power Platform pay-as-you-go environments."),
    },
    async ({ licenses_json, db_addon_gb, file_addon_gb, payg_environments }) => {
      const licenses = parseLicensesJson(licenses_json);
      const result = calculateCapacity(
        {
          licenses,
          addons: {
            db_gb: db_addon_gb ?? 0,
            file_gb: file_addon_gb ?? 0,
          },
          paygEnvironments: payg_environments ?? 0,
        },
        SKU_MAP
      );

      return buildCalculationResponse(result);
    }
  );

  return server;
}

function buildCalculationResponse(result) {
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

function parseLicensesJson(licensesJson) {
  let parsed;

  try {
    parsed = JSON.parse(licensesJson);
  } catch (error) {
    throw new Error(
      "licenses_json must be a valid JSON array of objects such as " +
        '[{"skuId":"pa-premium","count":150},{"skuId":"sales-ent","count":40}].'
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("licenses_json must parse to a JSON array.");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(
        `licenses_json item ${index + 1} must be an object with skuId and count.`
      );
    }

    return {
      skuId: String(item.skuId ?? ""),
      count: Number(item.count ?? 0),
    };
  });
}

function normalizeFamily(family) {
  const trimmed = String(family ?? "").trim();
  if (!trimmed) return "all";

  const lookup = {
    all: "all",
    dynamics365: "Dynamics365",
    powerapps: "PowerApps",
    powerautomate: "PowerAutomate",
    copilotstudio: "CopilotStudio",
  };

  return lookup[trimmed.toLowerCase()] ?? trimmed;
}

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
