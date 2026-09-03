---
title: Menu Manager + Scheduler — auth layer and schema change
status: database migrations applied 2026-09-02
project_ref: vmrxmcjnzhplkrzuicnf
audience: Claude Code
---

## Read this first

The Supabase database has **already been migrated**. Do not write, run, or
generate migrations. Do not open the Supabase dashboard. Your job is the
frontend only. If something looks like it needs a schema change, stop and say
so instead of doing it.

`strains.tiers` **no longer exists.** Any code path that reads it is broken
right now. Fixing that is task 1.

---

## What changed in the database

| Object | Change |
|---|---|
| `strains.tiers` | **dropped** — was jsonb keyed by tier |
| `strains` | added `brand_id`, `thc`, `cbd`, `archived`, `updated_at` |
| `brands` | new lookup: `house`, `caliente`, `orale`, `third_party` |
| `weight_options` | new lookup: weight → print page + optional subheader |
| `strain_weights` | new: one row per strain per offered weight, **each with its own price** |
| `app_roles` | new: `(user_id, app, role)` — `app` is `menu` or `scheduler`, `role` is `viewer` or `editor` |
| `v_print_menu` | new view — flattened join for the print output |
| `managers` | still present, no longer used by policies; leave it alone |

### Pricing moved

Price is **per weight**, not per strain. A strain offered as an eighth and a
quarter has two `strain_weights` rows with two prices. There is no
`strains.price`.

### Print layout is data, not code

`weight_options` drives the printed pages:

| weight | label | print_page | print_subhead |
|---|---|---|---|
| `1g` | Gram | `grams` | — |
| `3.5g` | Eighth | `eighths` | — |
| `7g` | Quarter | `eighths` | `Quarters` |
| `14g` | Half | `halves` | — |
| `28g` | Ounce | `ounces` | — |

Quarters print on the eighths page under a `Quarters` subheader. Do **not**
hardcode that. Group by `print_page`, then by `print_subhead` (null first),
then sort by `weight_sort`, then by strain name. Moving quarters to their own
page later must be a row edit, not a code change.

---

## Roles

Two logins, both real Supabase auth users:

| login | `app_roles` rows | can do |
|---|---|---|
| store (posted on whiteboard) | none | read everything, toggle `in_stock`, print |
| ICM | `('menu','editor')` and `('scheduler','editor')` | everything |

Read the role once after sign-in:

```ts
const { data } = await supabase
  .from('app_roles')
  .select('app, role')
  .eq('user_id', session.user.id);

const isMenuEditor = data?.some(r => r.app === 'menu' && r.role === 'editor');
const isSchedulerEditor = data?.some(r => r.app === 'scheduler' && r.role === 'editor');
```

Gate UI on those booleans. **The UI gate is cosmetic.** The database enforces
it: a `before update` trigger raises `42501` if a non-editor changes any column
other than `in_stock`. Surface that error as "You can only change stock status"
rather than a raw Postgres message.

---

## Tasks, one commit each

1. **Unbreak the app.** Remove all `tiers` reads. Strain price/THC/weights now
   come from `strain_weights` joined to `strains`.
2. **Login route.** Email + password. On success, load `app_roles`, put the two
   booleans in context. Redirect unauthenticated users to login in both apps.
3. **Menu Manager UI gate.** Non-editors: fields render read-only, no "Edit all"
   button, no add/delete. The `in_stock` dot stays tappable for everyone.
4. **Per-weight price editing.** The edit-all modal needs a price input per
   checked weight, not one price field. Checking a weight creates a
   `strain_weights` row; unchecking deletes it.
5. **Print view.** Query `v_print_menu`, group per the table above.
6. **Scheduler auth.** Same login, same context. Gate writes on
   `isSchedulerEditor`. Stop reading the `managers` table.

## Constraints

- Anon reads are gone. Every query needs a session or it returns zero rows.
- Locked UI config for the Menu Manager: alphabet-band grouping (A–H, I–N, O–U,
  V–Z), collapsible headers, tap-to-edit, per-row save, standard density, color
  by type, stock as a dot, buttons/checkboxes for pickers, edit-all as a modal,
  per-strain pricing, out-of-stock greys out in place.
- Desktop and iPad both. Touch targets ≥ 40px on iPad.
- Don't add a `profiles` table. Roles live in `app_roles`.
