import { useState, useEffect } from "react";

// ── Type colors ──────────────────────────────────────────────
const TC = { I: '#6B5B95', H: '#4A7A4A', S: '#B5651D' }; // print
const TU = { I: '#A99ED4', H: '#82C082', S: '#D9934A' }; // UI
const TO = { I: 0, H: 1, S: 2 };

// ── Tier config ──────────────────────────────────────────────
const TIER_CFG = {
  reserve: { label: 'Reserve', eighthsHeader: 'PURLIFE RESERVE · 4g SUPER EIGHTHS', eighthsPrice: '1 for $20 · 4 for $70 · 8 for $135', halvesHeader: 'PURLIFE RESERVE · ½ oz', halvesPrice: '$40 each · 2 for $75' },
  premium: { label: 'Premium', eighthsHeader: 'PURLIFE PREMIUM · 4g SUPER EIGHTHS', eighthsPrice: '1 for $15 · 4 for $50 · 8 for $95', halvesHeader: 'PURLIFE PREMIUM · ½ oz', halvesPrice: '$40 each · 2 for $75' },
  caliente: { label: 'Caliente', eighthsHeader: 'CALIENTE BRAND · 3.5g', eighthsPrice: '$9 each', halvesHeader: 'CALIENTE BRAND · ½ oz', halvesPrice: '$30 each · 2 for $55' },
  thirdParty: { label: 'Third Party', eighthsHeader: 'THIRD PARTY BRANDS · 3.5g', eighthsPrice: 'PRICED AS MARKED', halvesHeader: null, halvesPrice: null },
};
const TIER_ORDER = ['reserve', 'premium', 'caliente', 'thirdParty'];

const mkId = () => Math.random().toString(36).slice(2, 9);

// ── Data Migration Tool ──────────────────────────────────────
const migrateStrain = (s) => {
  // If it already has THC inside tiers.reserve, it is fully upgraded to v3
  if (s.tiers && s.tiers.reserve && s.tiers.reserve.thc !== undefined) return { ...s, inStock: s.inStock !== false }; 
  
  const t = {
    reserve: { active: false, eighths: false, halves: false, price: '', thc: '' },
    premium: { active: false, eighths: false, halves: false, price: '', thc: '' },
    caliente: { active: false, eighths: false, halves: false, price: '', thc: '' },
    thirdParty: { active: false, eighths: false, halves: false, price: '', thc: '' }
  };
  
  if (s.tier && t[s.tier]) {
    // Upgrading from v1
    t[s.tier] = { active: true, eighths: !!s.hasEighths, halves: !!s.hasHalves, price: s.price || '', thc: s.thc || '' };
  } else if (s.tiers) {
    // Upgrading from v2 (moves root THC into the active tiers)
    for (const key of Object.keys(t)) {
      if (s.tiers[key]) {
        t[key] = { ...s.tiers[key], thc: s.thc || '' };
      }
    }
  }
  
  // Strip out the old root-level properties
  const { tier, hasEighths, hasHalves, price, thc, ...rest } = s; 
  return { ...rest, tiers: t, inStock: s.inStock !== false };
};

// ── Initial Data ─────────────────────────────────────────────
const RAW_INITIAL_STRAINS = [
  { id: mkId(), tier: 'reserve', type: 'I', name: 'White Widow XXL', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Northern Lights', thc: '', lineage: 'Afghani × Thai Landrace', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'L.A. Banana Cake', thc: '', lineage: 'L.A. Kush Cake × Banana Punch', terpenes: 'Limonene · B-Caryophyllene · B-Pinene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Chicken n’ Wafflez', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Chocolate Waffles', thc: '', lineage: 'L.A. Amnesia × Thin Mints', terpenes: 'B-Caryophyllene · Terpinolene · Ocimene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Dark Phoenix', thc: '', lineage: 'Trainwreck × Jack Herrer', terpenes: 'Pinene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Superboof', thc: '', lineage: 'Black Cherry Punch × Tropicana Cookies', terpenes: 'D-Limonene · B-Caryophyllene · Nerolidol', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Alien OG', thc: '', lineage: 'Tahoe OG × Alien Kush', terpenes: 'Limonene · B-Caryophyllene · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Mystery Mix', thc: '', lineage: 'Mystery Machine × Cake Mix', terpenes: 'B-Caryophyllene · Limonene · Nerolidol', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Purple Octane x Jealousy', thc: '', lineage: 'Biscotti × Sherb Bx1 × Jealousy F2', terpenes: 'D-Limonene · B-Caryophyllene · Linalool · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Grand Master Kush', thc: '', lineage: 'Kush × Bubba Kush', terpenes: 'Myrcene · Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Coconut Milk', thc: '', lineage: 'Tropical Smoothie × Cereal Milk', terpenes: 'Myrcene · Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Hardcore OG', thc: '', lineage: 'Hardcore OG × Big Bud × DJ Short Blueberry', terpenes: 'D-Limonene · Linalool · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Irish Cannonball x Blue Dream', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Zack’s Cake', thc: '', lineage: 'Zack’s Pie × Jungle Cake', terpenes: 'B-Caryophyllene · D-Limonene · A-Pinene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Zkittles x Afghani', thc: '', lineage: 'Zkittles × Afghani', terpenes: 'Limonene · Myrcene · Linalool', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Don Mega', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Brain Freeze', thc: '', lineage: 'Legends Ultimate Indica × Cinderella 99', terpenes: 'Limonene · B-Caryophyllene · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Whiplash', thc: '', lineage: 'M8 × Lebanon 3', terpenes: 'Myrcene · B-Caryophyllene · Guaiol', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Seriotica', thc: '', lineage: 'Serious Mimosa × Cookies', terpenes: 'Limonene · A-Pinene · B-Pinene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Hypothermia', thc: '', lineage: 'Blunicorn × Slurricane 23', terpenes: 'Ocimene · A-Pinene · B-Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Hi-Fi 4G', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Hawaiian Dream', thc: '', lineage: 'Blue Dream × Mauie Wowie', terpenes: 'Terpinolene · B-Pinene · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Gorilla Cream', thc: '', lineage: 'GG4 × Cookies And Cream × Big Bud', terpenes: 'Myrcene · B-Caryophyllene · Limonene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Divine Frost', thc: '', lineage: 'Divine Gelato × Permafrost', terpenes: 'B-Caryophyllene · Limonene · A-Humulene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Cap Junky', thc: '', lineage: 'Alien Cookies × Kush Mints', terpenes: 'D-Limonene · B-Caryophyllene · Linalool', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Banana Kush', thc: '', lineage: 'Ghost OG × Skunk × Haze', terpenes: 'A-Pinene · Linalool · Guaiol', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Lemon Suit Larry', thc: '', lineage: 'Lemon Larry × Commerce City Kush', terpenes: 'Myrcene · Terpinolene · Ocimene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Tropical Cake', thc: '', lineage: 'Tropicana Cookie × Wedding Cake', terpenes: 'B-Caryophyllene · Limonene · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Açai Cookies', thc: '', lineage: 'Açaí Mints × Banana Punch', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Candied Taters', thc: '', lineage: 'Potato Kush × Candied Lemons', terpenes: 'Camphene · Terpinolene · A-Terpinolene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Champaya', thc: '', lineage: 'Papaya × Mimosa V6', terpenes: 'Limonene · A-Pinene · B-Pinene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Chapel of Love', thc: '', lineage: 'F1 Durban × Kush Mints × Gushers', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Cherry Animal Punch', thc: '', lineage: 'Animal Cookies × Cherry AK47 × Purple Punch', terpenes: 'B-Caryophyllene · Limonene · Humulene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Countree Grammar', thc: '', lineage: 'Açaí Mints × Banana Punch', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves:
