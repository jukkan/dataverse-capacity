import test from "node:test";
import assert from "node:assert/strict";

import { calculateCapacity } from "./calculator.js";
import { SKU_MAP } from "./skus.js";
import { parseLicensesJson } from "./server.js";

test("parseLicensesJson rejects malformed JSON", () => {
  assert.throws(
    () => parseLicensesJson("not-json"),
    /licenses_json must be a valid JSON array of objects/
  );
});

test("parseLicensesJson rejects non-array JSON", () => {
  assert.throws(
    () => parseLicensesJson('{"skuId":"pa-premium","count":1}'),
    /licenses_json must parse to a JSON array\./
  );
});

test("parseLicensesJson rejects non-object items", () => {
  assert.throws(
    () => parseLicensesJson('["pa-premium"]'),
    /licenses_json item 1 must be an object with skuId and count\./
  );
});

test("parseLicensesJson normalizes skuId and count values", () => {
  const licenses = parseLicensesJson(
    '[{"skuId":123,"count":"4"},{"skuId":"sales-ent","count":2}]'
  );

  assert.deepEqual(licenses, [
    { skuId: "123", count: 4 },
    { skuId: "sales-ent", count: 2 },
  ]);
});

test("calculateCapacity ignores unknown SKUs and reports a warning", () => {
  const result = calculateCapacity(
    {
      licenses: [{ skuId: "not-a-sku", count: 3 }],
    },
    SKU_MAP
  );

  assert.equal(result.tenant_pool.db_gb, 0);
  assert.equal(result.tenant_pool.file_gb, 0);
  assert.deepEqual(result.per_sku_breakdown, []);
  assert.deepEqual(result.errors, ['Unknown SKU id: "not-a-sku"']);
});

test("calculateCapacity clamps negative addon and pay-as-you-go inputs to zero", () => {
  const result = calculateCapacity(
    {
      licenses: [{ skuId: "pa-premium", count: 1 }],
      addons: { db_gb: -10, file_gb: -20 },
      paygEnvironments: -3,
    },
    SKU_MAP
  );

  assert.equal(result.tenant_pool.db_gb, 20.25);
  assert.equal(result.tenant_pool.file_gb, 22);
  assert.equal(result.tenant_pool.breakdown.addons.db_gb, 0);
  assert.equal(result.tenant_pool.breakdown.addons.file_gb, 0);
  assert.equal(result.payg_environments.count, 0);
  assert.equal(result.payg_environments.db_gb_total, 0);
  assert.equal(result.payg_environments.file_gb_total, 0);
});

test("calculateCapacity floors license counts before applying accrual", () => {
  const result = calculateCapacity(
    {
      licenses: [{ skuId: "pa-premium", count: 2.9 }],
    },
    SKU_MAP
  );

  assert.equal(result.per_sku_breakdown.length, 1);
  assert.equal(result.per_sku_breakdown[0].count, 2);
  assert.equal(result.tenant_pool.db_gb, 20.5);
  assert.equal(result.tenant_pool.file_gb, 24);
});

test("Customer Insights accrual is prorated by pack size and still requires the base license", () => {
  const active = calculateCapacity(
    {
      licenses: [
        { skuId: "ci-base", count: 1 },
        { skuId: "ci-interacted-t1", count: 1 },
        { skuId: "ci-interacted-t2", count: 1 },
        { skuId: "ci-interacted-t3", count: 1 },
        { skuId: "ci-unified-t1", count: 1 },
      ],
    },
    SKU_MAP
  );

  const interactedT1 = active.per_sku_breakdown.find(
    (row) => row.skuId === "ci-interacted-t1"
  );
  const interactedT2 = active.per_sku_breakdown.find(
    (row) => row.skuId === "ci-interacted-t2"
  );
  const unifiedT1 = active.per_sku_breakdown.find(
    (row) => row.skuId === "ci-unified-t1"
  );

  assert.equal(interactedT1.db_gb, 0.1);
  assert.equal(interactedT1.file_gb, 0.2);
  assert.equal(interactedT2.db_gb, 0.2);
  assert.equal(interactedT2.file_gb, 0.4);
  assert.equal(unifiedT1.db_gb, 15);
  assert.equal(unifiedT1.file_gb, 20);
  assert.equal(active.errors.length, 0);

  const withoutBase = calculateCapacity(
    {
      licenses: [{ skuId: "ci-interacted-t1", count: 1 }],
    },
    SKU_MAP
  );

  assert.deepEqual(withoutBase.errors, [
    'SKU "ci-interacted-t1" requires "ci-base" to be licensed — skipped.',
  ]);
});

test("calculateCapacity reflects the August 2026 Power Platform entitlement refresh", () => {
  const result = calculateCapacity(
    {
      licenses: [
        { skuId: "pa-premium", count: 1 },
        { skuId: "pautom-premium", count: 1 },
        { skuId: "pautom-process", count: 3 },
        { skuId: "process-mining", count: 2 },
      ],
    },
    SKU_MAP
  );

  assert.equal(result.tenant_pool.breakdown.default.db_gb, 20);
  assert.equal(result.tenant_pool.breakdown.default.file_gb, 20);

  const processRow = result.per_sku_breakdown.find(
    (row) => row.skuId === "pautom-process"
  );
  const miningRow = result.per_sku_breakdown.find(
    (row) => row.skuId === "process-mining"
  );

  assert.equal(processRow.db_gb, 0.15);
  assert.equal(processRow.file_gb, 0.6);
  assert.equal(miningRow.db_gb, 4);
  assert.equal(miningRow.file_gb, 2000);
  assert.equal(miningRow.capped, false);
  assert.equal(SKU_MAP["process-mining"].tenant_cap_db_gb, undefined);
});

test("shared entitlement data matches the current UI source of truth", async () => {
  const { SKUS, SKU_MAP, ENTITLEMENT_SOURCE } = await import('../../src/data/capacity-entitlements.js');
  const { calculateCapacity } = await import('../../src/lib/calculate-capacity.js');

  assert.deepEqual(ENTITLEMENT_SOURCE.asOf, '2026-08');
  assert.equal(SKU_MAP['pa-premium'].default.db_gb, 20);
  assert.equal(SKU_MAP['sales-ent'].default.file_gb, 40);
  assert.equal(
    calculateCapacity({ licenses: [{ skuId: 'pa-premium', count: 2 }], addons: {}, paygEnvironments: 0 }, SKU_MAP).tenant_pool.db_gb,
    20.5
  );
  assert.equal(SKUS.length, Object.keys(SKU_MAP).length);
});
