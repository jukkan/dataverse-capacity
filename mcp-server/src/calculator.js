/**
 * Pure, deterministic Dataverse capacity calculation engine.
 * No React, no side-effects — identical math to the interactive site.
 *
 * @param {Object} input
 * @param {Array<{skuId: string, count: number}>} input.licenses
 * @param {{db_gb?: number, file_gb?: number}} [input.addons]
 * @param {number} [input.paygEnvironments]
 * @param {import('./skus.js').SKU_MAP} skuMap  — pass SKU_MAP from skus.js
 * @returns {CalculationResult}
 */
export function calculateCapacity(
  { licenses = [], addons = {}, paygEnvironments = 0 },
  skuMap
) {
  const addonDb = Math.max(0, Number(addons.db_gb) || 0);
  const addonFile = Math.max(0, Number(addons.file_gb) || 0);

  let dbDefault = 0;
  let fileDefault = 0;

  let dbPerUserAccrual = 0;
  let filePerUserAccrual = 0;
  let dbPerAppAccrual = 0;
  let filePerAppAccrual = 0;
  let dbPerPackAccrual = 0;
  let filePerPackAccrual = 0;

  const skuUsage = {}; // tracks capped accrual per SKU (e.g. Process Mining)
  const breakdown = [];
  const errors = [];

  // Check if Customer Insights base is licensed
  const hasCI =
    licenses.find((l) => l.skuId === "ci-base" && l.count > 0) !== undefined;

  for (const { skuId, count } of licenses) {
    const rawCount = Math.max(0, Math.floor(Number(count) || 0));
    if (rawCount === 0) continue;

    const sku = skuMap[skuId];
    if (!sku) {
      errors.push(`Unknown SKU id: "${skuId}"`);
      continue;
    }

    // CI capacity packs require the CI base license
    if (sku.requires_base === "ci-base" && !hasCI) {
      errors.push(
        `SKU "${skuId}" requires "ci-base" to be licensed — skipped.`
      );
      continue;
    }

    // ── Default capacity (Max mode: highest eligible default wins) ──────────
    if (sku.eligible_for_default) {
      dbDefault = Math.max(dbDefault, sku.default.db_gb);
      fileDefault = Math.max(fileDefault, sku.default.file_gb);
    }

    // ── Accrued capacity ─────────────────────────────────────────────────────
    if (sku.accrues_capacity) {
      let addDb = rawCount * sku.accrual.db_gb;
      const addFile = rawCount * sku.accrual.file_gb;

      // Apply per-SKU tenant cap (e.g. Process Mining DB capped at 100 GB)
      if (sku.tenant_cap_db_gb !== undefined) {
        const used = skuUsage[sku.id] || 0;
        addDb = Math.min(addDb, Math.max(0, sku.tenant_cap_db_gb - used));
        skuUsage[sku.id] = used + addDb;
      }

      const isCapped =
        sku.tenant_cap_db_gb !== undefined &&
        addDb < rawCount * sku.accrual.db_gb;

      if (addDb > 0 || addFile > 0) {
        const isPerApp = sku.license_type === "PerApp";
        const isPerPack = sku.license_type === "CapacityPack";

        if (isPerApp) {
          dbPerAppAccrual += addDb;
          filePerAppAccrual += addFile;
        } else if (isPerPack) {
          dbPerPackAccrual += addDb;
          filePerPackAccrual += addFile;
        } else {
          dbPerUserAccrual += addDb;
          filePerUserAccrual += addFile;
        }

        breakdown.push({
          skuId: sku.id,
          skuName: sku.name,
          family: sku.family,
          count: rawCount,
          db_gb: round2(addDb),
          file_gb: round2(addFile),
          capped: isCapped,
        });
      }
    }
  }

  // Pay-as-you-go environments: each gets 1 GB DB + 1 GB File, NOT from tenant pool
  const paygCount = Math.max(0, Math.floor(Number(paygEnvironments) || 0));

  const tenantDbTotal = round2(
    dbDefault + dbPerUserAccrual + dbPerAppAccrual + dbPerPackAccrual + addonDb
  );
  const tenantFileTotal = round2(
    fileDefault +
      filePerUserAccrual +
      filePerAppAccrual +
      filePerPackAccrual +
      addonFile
  );

  return {
    tenant_pool: {
      db_gb: tenantDbTotal,
      file_gb: tenantFileTotal,
      breakdown: {
        default: {
          db_gb: round2(dbDefault),
          file_gb: round2(fileDefault),
        },
        per_user_accrual: {
          db_gb: round2(dbPerUserAccrual),
          file_gb: round2(filePerUserAccrual),
        },
        per_app_accrual: {
          db_gb: round2(dbPerAppAccrual),
          file_gb: round2(filePerAppAccrual),
        },
        per_pack_accrual: {
          db_gb: round2(dbPerPackAccrual),
          file_gb: round2(filePerPackAccrual),
        },
        addons: {
          db_gb: addonDb,
          file_gb: addonFile,
        },
      },
    },
    payg_environments: {
      count: paygCount,
      db_gb_each: 1,
      file_gb_each: 1,
      db_gb_total: paygCount,
      file_gb_total: paygCount,
      note: "Pay-as-you-go environment capacity is per-environment and does NOT consume the tenant pool.",
    },
    per_sku_breakdown: breakdown,
    errors,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
