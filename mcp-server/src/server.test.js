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
  assert.equal(result.tenant_pool.file_gb, 42);
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
  assert.equal(result.tenant_pool.file_gb, 44);
});