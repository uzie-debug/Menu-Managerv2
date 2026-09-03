import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmrxmcjnzhplkrzuicnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtcnhtY2puemhwbGtyenVpY25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDc0NTEsImV4cCI6MjEwMjM4MzQ1MX0.2xpjG8ROK8e2x7byo5l92kPYph1sD9YX0zVcLLHOWc0';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── DB ↔ JS field mapping ──────────────────────────────────
// Supabase uses snake_case, React state uses camelCase.

// The embedded select that strainFromDb expects.
export const STRAIN_SELECT = '*, strain_weights(weight, price)';

export const strainFromDb = (row) => ({
  id: row.id,
  type: row.type,
  name: row.name,
  lineage: row.lineage || '',
  terpenes: row.terpenes || '',
  brandId: row.brand_id || '',
  // numeric columns come back as numbers or null; the inputs want strings
  thc: row.thc == null ? '' : String(row.thc),
  cbd: row.cbd == null ? '' : String(row.cbd),
  inStock: row.in_stock !== false,
  archived: !!row.archived,
  // { '3.5g': 20, '7g': 30 } — price lives per weight, never on the strain
  weights: Object.fromEntries(
    (row.strain_weights ?? []).map(w => [w.weight, w.price == null ? '' : String(w.price)])
  ),
  createdAt: row.created_at,
});

// Numeric columns reject '' — send null instead.
const num = (v) => (v === '' || v == null ? null : Number(v));

// Deliberately does not include weights/prices. Those are rows in
// strain_weights and are written by saveWeights, not by a strains upsert.
export const strainToDb = (s) => ({
  id: s.id,
  type: s.type,
  name: s.name,
  lineage: s.lineage || '',
  terpenes: s.terpenes || '',
  brand_id: s.brandId || null,
  thc: num(s.thc),
  cbd: num(s.cbd),
  in_stock: s.inStock !== false,
  archived: !!s.archived,
});

export const extractFromDb = (row) => ({
  id: row.id,
  category: row.category,
  type: row.type,
  brand: row.brand || '',
  name: row.name,
  extract: row.extract_type,
  texture: row.texture || '',
  size: row.size,
  price: row.price || '',
  hasBattery: row.has_battery,
  inStock: row.in_stock,
  createdAt: row.created_at,
});

export const extractToDb = (e) => ({
  id: e.id,
  category: e.category,
  type: e.type,
  brand: e.brand || '',
  name: e.name,
  extract_type: e.extract,
  texture: e.texture || '',
  size: e.size,
  price: e.price || '',
  has_battery: !!e.hasBattery,
  in_stock: e.inStock !== false,
});
