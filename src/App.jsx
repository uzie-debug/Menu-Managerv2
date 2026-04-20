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
  const { flags, blanks, ...cleanS } = s; // Strips out deprecated flag data
  
  if (cleanS.tiers && cleanS.tiers.reserve && cleanS.tiers.reserve.thc !== undefined) {
    return { ...cleanS, inStock: cleanS.inStock !== false }; 
  }
  
  const t = {
    reserve: { active: false, eighths: false, halves: false, price: '', thc: '' },
    premium: { active: false, eighths: false, halves: false, price: '', thc: '' },
    caliente: { active: false, eighths: false, halves: false, price: '', thc: '' },
    thirdParty: { active: false, eighths: false, halves: false, price: '', thc: '' }
  };
  
  if (cleanS.tier && t[cleanS.tier]) {
    t[cleanS.tier] = { active: true, eighths: !!cleanS.hasEighths, halves: !!cleanS.hasHalves, price: cleanS.price || '', thc: cleanS.thc || '' };
  } else if (cleanS.tiers) {
    for (const key of Object.keys(t)) {
      if (cleanS.tiers[key]) {
        t[key] = { ...cleanS.tiers[key], thc: cleanS.thc || '' };
      }
    }
  }
  
  const { tier, hasEighths, hasHalves, price, thc, ...rest } = cleanS; 
  return { ...rest, tiers: t, inStock: cleanS.inStock !== false };
};

// ── Initial Data ─────────────────────────────────────────────
const RAW_INITIAL_STRAINS = [
  { id: mkId(), tier: 'reserve', type: 'I', name: 'White Widow XXL', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Northern Lights', thc: '', lineage: 'Afghani × Thai Landrace', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'L.A. Banana Cake', thc: '', lineage: 'L.A. Kush Cake × Banana Punch', terpenes: 'Limonene · B-Caryophyllene · B-Pinene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Chicken n’ Wafflez', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Chocolate Waffles', thc: '', lineage: 'L.A. Amnesia × Thin Mints', terpenes: 'B-Caryophyllene · Terpinolene · Ocimene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Dark Phoenix', thc: '', lineage: 'Trainwreck × Jack Herrer', terpenes: 'Pinene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Superboof', thc: '', lineage: 'Black Cherry Punch × Tropicana Cookies', terpenes: 'D-Limonene · B-Caryophyllene · Nerolidol', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Alien OG', thc: '', lineage: 'Tahoe OG × Alien Kush', terpenes: 'Limonene · B-Caryophyllene · Myrcene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Mystery Mix', thc: '', lineage: 'Mystery Machine × Cake Mix', terpenes: 'B-Caryophyllene · Limonene · Nerolidol', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Purple Octane x Jealousy', thc: '', lineage: 'Biscotti × Sherb Bx1 × Jealousy F2', terpenes: 'D-Limonene · B-Caryophyllene · Linalool · Myrcene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Grand Master Kush', thc: '', lineage: 'Kush × Bubba Kush', terpenes: 'Myrcene · Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Coconut Milk', thc: '', lineage: 'Tropical Smoothie × Cereal Milk', terpenes: 'Myrcene · Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Hardcore OG', thc: '', lineage: 'Hardcore OG × Big Bud × DJ Short Blueberry', terpenes: 'D-Limonene · Linalool · Myrcene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Irish Cannonball x Blue Dream', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Zack’s Cake', thc: '', lineage: 'Zack’s Pie × Jungle Cake', terpenes: 'B-Caryophyllene · D-Limonene · A-Pinene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Zkittles x Afghani', thc: '', lineage: 'Zkittles × Afghani', terpenes: 'Limonene · Myrcene · Linalool', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Don Mega', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Brain Freeze', thc: '', lineage: 'Legends Ultimate Indica × Cinderella 99', terpenes: 'Limonene · B-Caryophyllene · Myrcene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Whiplash', thc: '', lineage: 'M8 × Lebanon 3', terpenes: 'Myrcene · B-Caryophyllene · Guaiol', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Seriotica', thc: '', lineage: 'Serious Mimosa × Cookies', terpenes: 'Limonene · A-Pinene · B-Pinene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Hypothermia', thc: '', lineage: 'Blunicorn × Slurricane 23', terpenes: 'Ocimene · A-Pinene · B-Caryophyllene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Hi-Fi 4G', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Hawaiian Dream', thc: '', lineage: 'Blue Dream × Mauie Wowie', terpenes: 'Terpinolene · B-Pinene · Myrcene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Gorilla Cream', thc: '', lineage: 'GG4 × Cookies And Cream × Big Bud', terpenes: 'Myrcene · B-Caryophyllene · Limonene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Divine Frost', thc: '', lineage: 'Divine Gelato × Permafrost', terpenes: 'B-Caryophyllene · Limonene · A-Humulene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Cap Junky', thc: '', lineage: 'Alien Cookies × Kush Mints', terpenes: 'D-Limonene · B-Caryophyllene · Linalool', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Banana Kush', thc: '', lineage: 'Ghost OG × Skunk × Haze', terpenes: 'A-Pinene · Linalool · Guaiol', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Lemon Suit Larry', thc: '', lineage: 'Lemon Larry × Commerce City Kush', terpenes: 'Myrcene · Terpinolene · Ocimene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Tropical Cake', thc: '', lineage: 'Tropicana Cookie × Wedding Cake', terpenes: 'B-Caryophyllene · Limonene · Myrcene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Açai Cookies', thc: '', lineage: 'Açaí Mints × Banana Punch', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Candied Taters', thc: '', lineage: 'Potato Kush × Candied Lemons', terpenes: 'Camphene · Terpinolene · A-Terpinolene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Champaya', thc: '', lineage: 'Papaya × Mimosa V6', terpenes: 'Limonene · A-Pinene · B-Pinene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Chapel of Love', thc: '', lineage: 'F1 Durban × Kush Mints × Gushers', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Cherry Animal Punch', thc: '', lineage: 'Animal Cookies × Cherry AK47 × Purple Punch', terpenes: 'B-Caryophyllene · Limonene · Humulene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'I', name: 'Countree Grammar', thc: '', lineage: 'Açaí Mints × Banana Punch', terpenes: 'Myrcene · D-Limonene · B-Caryophyllene', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Critical Glue', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Franco’s Lemon Cheese', thc: '', lineage: 'Lemon Haze × Exodus Cheese', terpenes: 'B-Caryophyllene · Myrcene · Limonene', hasEighths: true, hasHalves: true }
];

const INITIAL_STRAINS = RAW_INITIAL_STRAINS.map(migrateStrain);

const INITIAL_EXTRACTS = [
  { id: mkId(), category: 'vape', type: 'H', brand: 'Purlife', name: 'Blue Dream', extract: 'Distillate', texture: '', size: '1g', price: '$35', hasBattery: true, inStock: true },
  { id: mkId(), category: 'vape', type: 'S', brand: 'Cookies', name: 'Gary Payton', extract: 'Live Resin', texture: '', size: '0.5g', price: '$45', hasBattery: false, inStock: true },
  { id: mkId(), category: 'concentrate', type: 'I', brand: 'DabCo', name: 'OG Kush', extract: 'Cured Resin', texture: 'Badder', size: '1g', price: '$30', hasBattery: false, inStock: true }
];

// ── Helpers ──────────────────────────────────────────────────
const sortItems = arr => [...arr].sort((a, b) => (TO[a.type] ?? 9) - (TO[b.type] ?? 9));

// ── Print HTML Builders ──────────────────────────────────────
function buildFlowerHtml(strains, menuType) {
  const sections = TIER_ORDER.map(tier => {
    const cfg = TIER_CFG[tier];
    if (menuType === 'halves' && !cfg.halvesHeader) return null;
    const relevant = strains.filter(s => s.inStock !== false && s.tiers?.[tier]?.active && (menuType === 'eighths' ? s.tiers[tier].eighths : s.tiers[tier].halves));
    const ts = sortItems(relevant);
    return ts.length ? { tier, cfg, strains: ts } : null;
  }).filter(Boolean);

  const isEighths = menuType === 'eighths';
  const title = isEighths ? 'FLOWER — SUPER EIGHTHS (4g) & THIRD PARTY (3.5g)' : 'FLOWER — HALF OUNCES (½ oz)';

  const tables = sections.map(sec => {
    const isThirdParty = sec.tier === 'thirdParty';
    const cols = (isEighths && !isThirdParty) ? 4 : 5;
    const hdr = isEighths ? sec.cfg.eighthsHeader : sec.cfg.halvesHeader;
    const priceHdr = isEighths ? sec.cfg.eighthsPrice : sec.cfg.halvesPrice;

    const colHdr = (isEighths && !isThirdParty)
      ? '<tr class="chdr"><th>TYPE</th><th>STRAIN · LINEAGE</th><th>THC</th><th>COMMONLY DOMINANT TERPENES</th></tr>'
      : '<tr class="chdr"><th>TYPE</th><th>STRAIN · LINEAGE</th><th>THC</th><th>PRICE</th><th>COMMONLY DOMINANT TERPENES</th></tr>';

    const rowsHtml = sec.strains.map((s, i) => {
      const linVal = s.lineage || '';
      const terpVal = s.terpenes || '';
      const bg = i % 2 === 0 ? '' : 'style="background:#ebebeb"';
      const nameCell = `<strong>${s.name}</strong>${linVal ? `<br><span class="lin">${linVal}</span>` : ''}`;
      
      const tierData = s.tiers[sec.tier];
      const thcStr = tierData.thc ? `${tierData.thc}%` : '';
      
      if (isEighths && !isThirdParty) {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${thcStr}</td><td class="terp">${terpVal}</td></tr>`;
      } else if (isEighths && isThirdParty) {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${thcStr}</td><td class="ctr"><strong>${tierData.price || ''}</strong></td><td class="terp">${terpVal}</td></tr>`;
      } else {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${thcStr}</td><td class="ctr"><strong>$40</strong><br><span class="sub">2/$75</span></td><td class="terp">${terpVal}</td></tr>`;
      }
    }).join('');
    return `<table><thead><tr><td class="th-name" colspan="${cols}">${hdr}</td></tr><tr><td class="th-price" colspan="${cols}">${priceHdr}</td></tr>${colHdr}</thead><tbody>${rowsHtml}</tbody></table>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PurLife – ${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box} body{font-family:Helvetica,Arial,sans-serif;font-size:9pt;color:#1a1a1a;padding:.4in}
.store{font-size:18pt;font-weight:bold;text-align:center;margin-bottom:3px} .ttl{font-size:12pt;font-weight:bold;text-align:center;color:#2e2e2e;margin-bottom:5px}
hr{border:none;border-top:1px solid #2e2e2e;margin-bottom:4px} .leg{font-size:8pt;color:#555;text-align:center;margin-bottom:8px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
.th-name td{background:#2e2e2e;color:#fff;font-weight:bold;font-size:9pt;padding:5px 6px 2px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.th-price td{background:#2e2e2e;color:#fff;font-weight:bold;font-size:12pt;text-align:center;padding:2px 6px 6px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.chdr th{background:#e8e8e8;font-size:7pt;color:#555;padding:3px 5px;text-align:left;border-bottom:1px solid #888;font-weight:bold;print-color-adjust:exact;-webkit-print-color-adjust:exact}
tbody tr td{padding:3px 5px;border-bottom:1px solid #ccc;vertical-align:middle}
.tc{font-weight:bold;font-size:9.5pt;text-align:center;width:5%} .ctr{text-align:center}
.lin{font-size:7pt;color:#555;font-style:italic} .sub{font-size:7.5pt;color:#555} .terp{font-size:7.5pt;width:${isEighths ? '47%' : '46%'}}
.foot{font-size:6.5pt;color:#888;text-align:center;border-top:.5px solid #aaa;padding-top:4px;margin-top:8px}
</style></head><body>
<div class="store">PURLIFE — HOBBS</div><div class="ttl">${title}</div><hr>
<div class="leg"><span style="color:${TC.I};font-weight:bold">I</span> Indica &nbsp;&nbsp; <span style="color:${TC.H};font-weight:bold">H</span> Hybrid &nbsp;&nbsp; <span style="color:${TC.S};font-weight:bold">S</span> Sativa</div>
${tables}
<div class="foot">Prices subject to change</div><script>window.onload=function(){window.print()}</script></body></html>`;
}

function buildExtractsHtml(extracts) {
  const active = extracts.filter(e => e.inStock !== false);
  const vapes = sortItems(active.filter(e => e.category === 'vape'));
  const concentrates = sortItems(active.filter(e => e.category === 'concentrate'));

  const buildRows = (items) => items.map((s, i) => {
    const bg = i % 2 === 0 ? '' : 'style="background:#ebebeb"';
    const extVal = s.category === 'vape' ? s.extract : `${s.extract} ${s.texture || ''}`.trim();
    return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${s.name}</td><td>${extVal}</td><td class="ctr">${s.size}</td><td class="ctr"><strong>${s.price}</strong></td></tr>`;
  }).join('');

  const renderBrandGroup =
