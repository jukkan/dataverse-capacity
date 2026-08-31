import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPACITY_IMPACT_LABELS,
  SKU_MAP,
  getCapacityImpact,
} from "./capacity-entitlements.js";

test("getCapacityImpact classifies default-only, default+accrual, accrual-only, and no-capacity SKUs", () => {
  assert.equal(getCapacityImpact(SKU_MAP["pa-premium"]), "default-and-accrual");
  assert.equal(getCapacityImpact(SKU_MAP["sales-pro"]), "default-only");
  assert.equal(getCapacityImpact(SKU_MAP["operations-activity"]), "accrual-only");
  assert.equal(getCapacityImpact(SKU_MAP["copilot-studio"]), "default-only");
  assert.equal(getCapacityImpact(SKU_MAP["ci-base"]), "default-only");
  assert.equal(
    getCapacityImpact({
      eligible_for_default: false,
      accrues_capacity: false,
      default: { db_gb: 0, file_gb: 0 },
      accrual: { db_gb: 0, file_gb: 0 },
    }),
    "no-capacity"
  );
  assert.equal(CAPACITY_IMPACT_LABELS["default-only"], "default only");
  assert.equal(CAPACITY_IMPACT_LABELS["accrual-only"], "accrual only");
});
