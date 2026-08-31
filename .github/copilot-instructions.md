# Copilot instructions for dataverse-capacity

## UI change validation
- When updating capacity tooltips, license rows, or collapsed panels, verify the hover/focus affordance is not clipped by ancestor containers.
- Check for `overflow-hidden` on ancestor wrappers in the product selection sidebar and prefer `overflow-visible` or a more local clipping strategy when showing help text.
- Run `npm run build` after UI changes to confirm the app still compiles.
- For manual verification, open the calculator, hover the info icons in the product tiers, and confirm the full tooltip remains visible without being cut off.

## Working conventions
- Keep logic changes limited to the current issue and reuse the existing `capacity-entitlements.js` and `calculate-capacity.js` sources for entitlement behavior.
- Prefer small, focused edits and avoid rewriting unrelated styles or logic.
