# Dataverse capacity calculator

---

## 1. Scope and concepts

* Capacity types in scope

  * `Dataverse_DB` – main data tables.
  * `Dataverse_File` – attachments.
  * `Dataverse_Log` – audit / change tracking.
* Capacity is **pooled at tenant level** and shared across all environments that use subscription-based Dataverse storage.
* Capacity comes from four sources:

  1. Default capacity from eligible subscriptions.
  2. Accrued capacity per license / per app / per pack.
  3. Dataverse capacity add-ons.
  4. Pay-as-you-go Dataverse meters (per environment).

The calculator’s job: given license counts and add-ons, output total Dataverse_DB / File / Log capacity (GB) and optionally separate out pay-as-you-go environments.

---

## 2. Data model the agent should use

### 2.1 SKU definition

Represent each SKU (Power Apps, Power Automate, Power Pages, Copilot Studio, Dynamics 365, etc.) as an object:

```jsonc
Sku {
  id: string,                  // internal key, e.g. "PA_Premium"
  family: "PowerApps" | "PowerAutomate" | "PowerPages" | "CopilotStudio" | "Dynamics365",
  product_group: string,       // for D365 table row (e.g. "ContactCenter", "SalesEnterprise")
  license_type: "Base" | "Attach" | "CapacityPack" | "PerApp" | "PerFlow" | "PerBot" | "Other",
  eligible_for_default: bool,  // whether this SKU can set tenant default
  default: {                   // default capacity for this SKU, per tenant
    db_gb: number | 0,
    file_gb: number | 0,
    log_gb: number | 0
  },
  accrual: {                   // per license / app / pack / bot etc.
    db_gb: number | 0,
    file_gb: number | 0,
    log_gb: number | 0
  },
  accrues_capacity: bool,      // false for D365 attach licenses except CI attach
  tenant_cap_db_gb?: number    // optional cap (e.g. Process Mining 100 GB total)
}
```

Populate this from:

* Power Platform Licensing Guide Dec 2025 (Power Apps, Power Automate, Power Pages tables).
* Dynamics 365 Licensing Guide Dec 2025 capacity table for D365 product groups (default + accrual).
* Microsoft Copilot Studio deck for Dataverse for Copilot Studio defaults.

The calculator doesn’t need the full guides if it has this SKU metadata.

### 2.2 Other entities

```jsonc
TenantInput {
  licenses: Array<{ skuId: string, count: number }>,
  payg_environments: number,             // Power Platform pay-as-you-go envs using Dataverse meters
  dataverse_addons: {                    // subscription add-ons
    db_gb: number,
    file_gb: number,
    log_gb: number
  }
}
```

Add-ons are in 1 GB increments and are tenant-pooled.

Pay-as-you-go environments get their own 1 GB DB + 1 GB File each and do **not** consume tenant-wide capacity.

---

## 3. Calculation rules

### 3.1 Default capacity (subscription-based tenant pool)

1. For Power Platform standalone licenses (Power Apps, Power Automate, Power Pages, Copilot Studio):

   * There is **one tenant default Dataverse capacity**, set by the first qualifying subscription purchased. This default equals the default entitlement of that first SKU. Additional subscriptions do **not** add further default capacity; they only accrue.
2. For Dynamics 365:

   * The first **base** license for each D365 product group brings in its product’s default Dataverse capacity (the values shown as “Included Per Tenant Max” in the D365 table). Default capacity is **not cumulative within a product group**, and attach licenses do not add capacity (except CI attach = same default as CI base).([Microsoft][1])
3. In practice, for a calculator you have two options for combining defaults:

   * **Simple mode (spec-loyal):**

     * Allow the user to pick *one* “primary capacity provider” among their eligible subscriptions; use only that SKU’s default as tenant-wide Dataverse default.
   * **Max mode (conservative / common reading of “Included Per Tenant Max”):**

     * For each Dataverse capacity type, take the **maximum default** across all licensed SKUs that are eligible for default and use that as tenant default. (This avoids overstating capacity if Microsoft actually only grants one.)

Recommend exposing this as a toggle in the tool because the guides are not perfectly explicit on cross-product behaviour.

Implementation outline (Max mode):

```python
default_db = default_file = default_log = 0
for (sku, count) in licenses:
    if count > 0 and sku.eligible_for_default:
        default_db = max(default_db, sku.default.db_gb)
        default_file = max(default_file, sku.default.file_gb)
        default_log = max(default_log, sku.default.log_gb)
```

### 3.2 Accrued capacity (subscription-based tenant pool)

* For every license/app/bot/pack that **accrues capacity**, multiply count by accrual values and sum.

Rules:

1. Power Platform standalone SKUs (per Dec 2025 guide):

   * Every Power Apps, Power Automate and Power Pages standalone subscription accrues additional Dataverse DB/File capacity.
   * Some SKUs also accrue Log capacity (mainly Power Pages capacity packs).
   * Process Mining add-on accrues large File capacity and some DB, with a 100 GB tenant cap on DB accrual.
   * Dataverse for Copilot Studio does **not** accrue extra per pack; it only has a tenant-level default.

2. Dynamics 365:

   * Each **enterprise base license** accrues Dataverse DB and File per user according to the D365 table. Accrual values are small (MB-level) but add up across many users.
   * **Attach licenses:**

     * Do **not** accrue additional capacity, except Customer Insights Attach, which has the same default capacity as CI base but still does not add extra accrual per user.([Microsoft][1])

3. Multiply and sum:

```python
accrued_db = accrued_file = accrued_log = 0
sku_usage = {}  # for tracking caps per sku if needed

for (sku, count) in licenses:
    if not sku.accrues_capacity:
        continue
    # raw accrual
    add_db = count * sku.accrual.db_gb
    add_file = count * sku.accrual.file_gb
    add_log = count * sku.accrual.log_gb

    # optional tenant cap by sku (e.g. Process Mining DB 100 GB)
    if sku.tenant_cap_db_gb is not None:
        existing = sku_usage.get(sku.id, 0)
        add_db = min(add_db, max(0, sku.tenant_cap_db_gb - existing))
        sku_usage[sku.id] = existing + add_db

    accrued_db += add_db
    accrued_file += add_file
    accrued_log += add_log
```

### 3.3 Pay-as-you-go Dataverse environments

* Each **pay-as-you-go environment**:

  * 1 GB Dataverse_DB + 1 GB Dataverse_File, no Log capacity.
  * This entitlement is per environment, one-time, and **does not consume tenant-wide Dataverse capacity**. Usage beyond that is billed via Dataverse meters.

For the calculator:

```python
payg_db = payg_envs * 1.0
payg_file = payg_envs * 1.0
payg_log = 0.0
```

Expose pay-as-you-go capacity separately from tenant pool, e.g.:

* `tenant_pool_db/file/log`
* `payg_envs_db/file`

So users see both.

### 3.4 Dataverse capacity add-ons

* Add-ons are simple: each unit = +1 GB of DB/File/Log respectively, pooled tenant-wide.

```python
addon_db = addons.db_gb
addon_file = addons.file_gb
addon_log = addons.log_gb
```

### 3.5 Final totals (subscription-based pool)

```python
total_db = default_db + accrued_db + addon_db
total_file = default_file + accrued_file + addon_file
total_log = default_log + accrued_log + addon_log
```

Return structure example:

```jsonc
DataverseCapacityResult {
  tenant_pool: {
    db_gb: number,
    file_gb: number,
    log_gb: number
  },
  payg_environments: {
    count: number,
    db_gb_total: number,
    file_gb_total: number
  },
  breakdown_by_family: { /* optional detailed breakdown */ }
}
```

---

## 4. Important edge cases to encode

1. **Attach licenses:** No extra capacity except Customer Insights attach default = CI base default, but still no accrual.([Microsoft][1])
2. **Dataverse for Teams:** Out of scope; no capacity add-ons; handled with separate limits.
3. **Process Mining add-on:** Tenant cap of 100 GB on DB accrual from these licenses.
4. **Units:** Guides mix MB and GB; calculator should convert everything to GB internally (1 GB = 1024 MB).

If you give this spec + a CSV/JSON of all SKUs with their Dec-2025 default/accrual numbers, a coding agent should have everything needed to implement an accurate interactive calculator.

[1]: https://www.microsoft.com/content/dam/microsoft/final/en-us/microsoft-brand/documents/Dynamics-365-Licensing-Guide-July-2024.pdf?utm_source=chatgpt.com "Dynamics 365 Licensing Guide"
