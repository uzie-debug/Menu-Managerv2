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

  const renderBrandGroup = (brand, disposables, carts) => {
    let html = `<div class="brand-box"><div class="brand-title">${brand.toUpperCase()}</div>`;
    if (disposables.length) {
      html += `<table><thead><tr><td class="sub-hdr" colspan="5">DISPOSABLES (Includes Battery)</td></tr><tr class="chdr"><th>TYPE</th><th>STRAIN / FLAVOR</th><th>EXTRACT TYPE</th><th>SIZE</th><th>PRICE</th></tr></thead><tbody>${buildRows(disposables)}</tbody></table>`;
    }
    if (carts.length) {
      html += `<table><thead><tr><td class="sub-hdr" colspan="5">CARTRIDGES</td></tr><tr class="chdr"><th>TYPE</th><th>STRAIN / FLAVOR</th><th>EXTRACT TYPE</th><th>SIZE</th><th>PRICE</th></tr></thead><tbody>${buildRows(carts)}</tbody></table>`;
    }
    return html + `</div>`;
  };

  let vapesHtml = '';
  if (vapes.length) {
    vapesHtml += `<div class="master-hdr">DISPOSABLES & CARTRIDGES</div>`;
    const brands = [...new Set(vapes.map(v => v.brand))].sort();
    brands.forEach(brand => {
      const brandVapes = vapes.filter(v => v.brand === brand);
      const disposables = brandVapes.filter(v => v.hasBattery);
      const carts = brandVapes.filter(v => !v.hasBattery);
      vapesHtml += renderBrandGroup(brand, disposables, carts);
    });
  }

  let concHtml = '';
  if (concentrates.length) {
    concHtml += `<div class="master-hdr" style="margin-top:20px;">CONCENTRATES</div>`;
    const brands = [...new Set(concentrates.map(c => c.brand))].sort();
    brands.forEach(brand => {
      const brandConcs = concentrates.filter(c => c.brand === brand);
      concHtml += `<div class="brand-box"><div class="brand-title">${brand.toUpperCase()}</div>`;
      concHtml += `<table><thead><tr class="chdr"><th>TYPE</th><th>STRAIN</th><th>EXTRACT TYPE</th><th>SIZE</th><th>PRICE</th></tr></thead><tbody>${buildRows(brandConcs)}</tbody></table></div>`;
    });
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PurLife – Extracts & Vapes</title>
<style>
*{margin:0;padding:0;box-sizing:border-box} body{font-family:Helvetica,Arial,sans-serif;font-size:9pt;color:#1a1a1a;padding:.4in}
.store{font-size:18pt;font-weight:bold;text-align:center;margin-bottom:3px} .ttl{font-size:12pt;font-weight:bold;text-align:center;color:#2e2e2e;margin-bottom:5px}
hr{border:none;border-top:1px solid #2e2e2e;margin-bottom:15px} .leg{font-size:8pt;color:#555;text-align:center;margin-bottom:15px}
.master-hdr{background:#111;color:#fff;font-weight:bold;font-size:14pt;text-align:center;padding:6px;margin-bottom:15px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.brand-box{border:2px solid #2e2e2e;padding:10px;margin-bottom:15px;page-break-inside:avoid;border-radius:4px;}
.brand-title{background:#2e2e2e;color:#fff;font-size:12pt;font-weight:bold;text-align:center;padding:4px;margin:-10px -10px 10px -10px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
table{width:100%;border-collapse:collapse;margin-bottom:10px} table:last-child{margin-bottom:0}
.sub-hdr{background:#666;color:#fff;font-weight:bold;font-size:9pt;padding:4px 6px;text-align:center;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.chdr th{background:#e8e8e8;font-size:7pt;color:#555;padding:3px 5px;text-align:left;border-bottom:1px solid #888;font-weight:bold;print-color-adjust:exact;-webkit-print-color-adjust:exact}
tbody tr td{padding:5px;border-bottom:1px solid #ccc;vertical-align:middle}
.tc{font-weight:bold;font-size:9.5pt;text-align:center;width:5%} .ctr{text-align:center}
.foot{font-size:6.5pt;color:#888;text-align:center;border-top:.5px solid #aaa;padding-top:4px;margin-top:15px}
</style></head><body>
<div class="store">PURLIFE — HOBBS</div><div class="ttl">EXTRACTS & VAPES</div><hr>
<div class="leg"><span style="color:${TC.I};font-weight:bold">I</span> Indica &nbsp;&nbsp; <span style="color:${TC.H};font-weight:bold">H</span> Hybrid &nbsp;&nbsp; <span style="color:${TC.S};font-weight:bold">S</span> Sativa</div>
${vapesHtml}${concHtml}
<div class="foot">Prices subject to change</div><script>window.onload=function(){window.print()}</script></body></html>`;
}

// ── UI theme ─────────────────────────────────────────────────
const C = { bg: '#18182a', panel: '#21213a', border: '#35355a', text: '#ccc8e8', muted: '#7a77a0', accent: '#7c6fcd', danger: '#c05050', good: '#5a9a5a' };

// ── Main app ─────────────────────────────────────────────────
export default function MenuApp() {
  const [strains, setStrains] = useState(INITIAL_STRAINS);
  const [extracts, setExtracts] = useState(INITIAL_EXTRACTS);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('edit-flower');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  
  // PASTE IT HERE!
  const [showHelp, setShowHelp] = useState(false);

  // LOAD FROM LOCALSTORAGE
  useEffect(() => {
    const savedStrains = localStorage.getItem('purlife-strains-v2');
    const savedExtracts = localStorage.getItem('purlife-extracts-v2');
    if (savedStrains) {
      try { setStrains(JSON.parse(savedStrains).map(migrateStrain)); } catch (e) { }
    }
    if (savedExtracts) {
      try { setExtracts(JSON.parse(savedExtracts).map(s => ({ ...s, inStock: s.inStock !== false }))); } catch (e) { }
    }
    setLoaded(true);
  }, []);

  // SAVE TO LOCALSTORAGE
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('purlife-strains-v2', JSON.stringify(strains));
    localStorage.setItem('purlife-extracts-v2', JSON.stringify(extracts));
  }, [strains, extracts, loaded]);

  const deleteItem = (id, isExtract) => {
    if (window.confirm('Remove this item entirely? (Hint: You can just mark it "Out of Stock" instead!)')) {
      if (isExtract) setExtracts(p => p.filter(s => s.id !== id));
      else setStrains(p => p.filter(s => s.id !== id));
    }
  };

  const toggleStock = (id, isExtract) => {
    if (isExtract) setExtracts(p => p.map(s => s.id === id ? { ...s, inStock: s.inStock === false ? true : false } : s));
    else setStrains(p => p.map(s => s.id === id ? { ...s, inStock: s.inStock === false ? true : false } : s));
  };

  const openEdit = (s, isExtract) => { setEditing({ ...s, isExtract }); setForm({ ...s }); };
  
  const openNewFlower = () => { 
    setEditing({ isNew: true, isExtract: false }); 
    setForm({ 
      id: mkId(), type: 'H', name: '', lineage: '', terpenes: '', inStock: true,
      tiers: {
        reserve: { active: true, eighths: true, halves: true, price: '', thc: '' },
        premium: { active: false, eighths: true, halves: true, price: '', thc: '' },
        caliente: { active: false, eighths: true, halves: true, price: '', thc: '' },
        thirdParty: { active: false, eighths: true, halves: false, price: '', thc: '' }
      }
    }); 
  };
  
  const openNewExtract = () => { setEditing({ isNew: true, isExtract: true }); setForm({ id: mkId(), category: 'vape', type: 'H', brand: '', name: '', extract: 'Distillate', texture: '', size: '1g', price: '', hasBattery: false, inStock: true }); };

  const saveForm = () => {
    if (editing.isExtract) {
      if (editing.isNew) setExtracts(p => [...p, form]);
      else setExtracts(p => p.map(s => s.id === form.id ? form : s));
    } else {
      if (editing.isNew) setStrains(p => [...p, form]);
      else setStrains(p => p.map(s => s.id === form.id ? form : s));
    }
    setEditing(null);
  };
  const exportBackup = () => {
  // Package up the current state
  const backupData = {
    strains: strains,
    extracts: extracts // Assuming you have your extracts state here too!
  };
  
  // Create a digital "file" in the browser
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create an invisible link, click it to download, and clean it up
  const link = document.createElement('a');
  link.href = url;
  // Names the file with today's date so your downloads folder stays organized
  link.download = `purlife-menu-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  const doPrint = (menuType) => {
    const html = menuType === 'extracts' ? buildExtractsHtml(extracts) : buildFlowerHtml(strains, menuType);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── Edit Modal ─────────────────────────────────────────────
  const EditModal = () => {
    const inp = (field, type = 'text') => <input type={type} value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={{ width: '100%', background: '#14142a', border: `1px solid ${C.border}`, color: C.text, padding: '6px 8px', borderRadius: '3px', fontSize: '13px' }} />;
    const sel = (field, opts) => <select value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={{ width: '100%', background: '#14142a', border: `1px solid ${C.border}`, color: C.text, padding: '6px 8px', borderRadius: '3px', fontSize: '13px' }}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
    const lbl = (text) => <label style={{ display: 'block', color: C.muted, fontSize: '11px', marginBottom: '4px' }}>{text}</label>;
    
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#1a1a2e', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '22px', width: '550px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
          <h3 style={{ color: C.text, marginBottom: '16px', fontSize: '15px' }}>{editing.isNew ? 'Add Item' : `Edit: ${form.name}`}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
            <div>{lbl('Type')}{sel('type', [['I', 'Indica'], ['H', 'Hybrid'], ['S', 'Sativa']])}</div>
            <div>{lbl(editing.isExtract ? 'Strain / Flavor Name' : 'Strain Name')}{inp('name')}</div>
          </div>

          {!editing.isExtract && (
            <>
              <div style={{ marginBottom: '10px' }}>{lbl('Dominant Terpenes')}{inp('terpenes')}</div>
              <div style={{ marginBottom: '14px' }}>{lbl('Lineage')}{inp('lineage')}</div>
              
              <div style={{ marginBottom: '14px', background: '#252540', padding: '10px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                {lbl('Available Tiers (Check all that apply)')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '8px' }}>
                  {TIER_ORDER.map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.text, fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!form.tiers?.[t]?.active} onChange={e => {
                        const checked = e.target.checked;
                        setForm(p => ({ ...p, tiers: { ...p.tiers, [t]: { ...p.tiers[t], active: checked } } }));
                      }} />
                      {TIER_CFG[t].label}
                    </label>
                  ))}
                </div>
              </div>

              {TIER_ORDER.filter(t => form.tiers?.[t]?.active).map(t => (
                <div key={t} style={{ background: '#1c1c31', border: `1px solid ${C.border}`, padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
                  <div style={{ color: C.text, fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>{TIER_CFG[t].label} Settings</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      {lbl('THC %')}
                      <input value={form.tiers[t].thc || ''} onChange={e => {
                        const val = e.target.value;
                        setForm(p => ({ ...p, tiers: { ...p.tiers, [t]: { ...p.tiers[t], thc: val } } }));
                      }} style={{ width: '100%', background: '#14142a', border: `1px solid ${C.border}`, color: C.text, padding: '6px 8px', borderRadius: '3px', fontSize: '13px' }} />
                    </div>

                    {t === 'thirdParty' && (
                      <div>
                        {lbl('Price (e.g. $45)')}
                        <input value={form.tiers[t].price || ''} onChange={e => {
                          const val = e.target.value;
                          setForm(p => ({ ...p, tiers: { ...p.tiers, [t]: { ...p.tiers[t], price: val } } }));
                        }} style={{ width: '100%', background: '#14142a', border: `1px solid ${C.border}`, color: C.text, padding: '6px 8px', borderRadius: '3px', fontSize: '13px' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '20px' }}>
                    {[['eighths', 'In Eighths'], ['halves', 'In Halves']].map(([f, l]) => (
                      <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.text, cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={!!form.tiers[t][f]} onChange={e => {
                          const checked = e.target.checked;
                          setForm(p => ({ ...p, tiers: { ...p.tiers, [t]: { ...p.tiers[t], [f]: checked } } }));
                        }} />{l}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {editing.isExtract && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>{lbl('Category')}{sel('category', [['vape', 'Vape / Cart'], ['concentrate', 'Concentrate (Wax)']])}</div>
                <div>{lbl('Brand')}{inp('brand')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: form.category === 'concentrate' ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>{lbl('Extract Type')}{sel('extract', [['Distillate','Distillate'],['Live Resin','Live Resin'],['Cured Resin','Cured Resin'],['Live Rosin','Live Rosin']])}</div>
                
                {form.category === 'concentrate' && (
                  <div>{lbl('Texture')}{sel('texture', [['','-- Blank --'],['Badder','Badder'],['Sugar','Sugar'],['Crumble','Crumble'],['Wax','Wax'],['Shatter','Shatter']])}</div>
                )}
                
                <div>{lbl('Size')}{sel('size', [['0.5g','0.5g'],['1g','1g'],['2g','2g'],['3.5g','3.5g'],['4g','4g']])}</div>
                <div>{lbl('Price (e.g. $40)')}{inp('price')}</div>
              </div>
              {form.category === 'vape' && (
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.text, cursor: 'pointer', fontSize: '13px' }}><input type="checkbox" checked={!!form.hasBattery} onChange={e => setForm(p => ({ ...p, hasBattery: e.target.checked }))} />Includes Battery (Disposable)</label>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button onClick={() => setEditing(null)} style={{ background: C.panel, color: C.muted, border: `1px solid ${C.border}`, padding: '7px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveForm} style={{ background: C.accent, color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
          </div>
        </div>
      </div>
    );
  };

// ── Main Render ────────────────────────────────────────────
  const HelpModal = () => {
  if (!showHelp) return null;
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: C.panel, padding: '24px', borderRadius: '8px', maxWidth: '500px', color: C.text, border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <h2 style={{ marginTop: 0, color: '#fff', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
          Menu Manager Tutorial
        </h2>
        <ul style={{ lineHeight: '1.8', fontSize: '14px', paddingLeft: '20px' }}>
          <li><strong>Adding Inventory:</strong> Click "Add Strain" or "Add Extract" to create a new database entry.</li>
          <li><strong>Flower Tiers:</strong> Check the boxes for Reserve, Premium, etc., to assign a strain to a tier. You can assign one strain to multiple tiers!</li>
          <li><strong>Third-Party Pricing:</strong> If you select the "Third Party" tier, a custom price box will appear for that specific item.</li>
          <li><strong>In-Stock Toggle:</strong> Use the ON/OFF button to temporarily hide an item from the printed menu without deleting it from the database.</li>
          <li><strong>Backups:</strong> Click the "Backup JSON" button to download your menu data. Do this regularly to prevent data loss!</li>
        </ul>
        <button 
          onClick={() => setShowHelp(false)} 
          style={{ background: C.accent, color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', width: '100%', marginTop: '15px', fontWeight: 'bold' }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui,sans-serif', color: C.text }}>
      
      {/* 1. We call the Help Modal here at the top of the app! */}
      <HelpModal />

      {/* 2. Unified Top Header with Buttons */}
      <div style={{ background: '#12122a', borderBottom: `1px solid ${C.border}`, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff', letterSpacing: '0.5px' }}>PURLIFE — HOBBS</div>
          <div style={{ fontSize: '11px', color: C.muted }}>Menu Manager v2</div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={exportBackup} 
            style={{ background: C.panel, color: C.text, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            💾 Backup JSON
          </button>
          <button 
            onClick={() => setShowHelp(true)} 
            style={{ background: C.panel, color: C.text, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            ❓ Help
          </button>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#12122a', overflowX: 'auto' }}>
        {[['edit-flower', 'Edit Flower'], ['edit-extracts', 'Edit Extracts'], ['eighths', 'Print Eighths'], ['halves', 'Print Halves'], ['extracts', 'Print Extracts']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 18px', border: 'none', background: 'transparent', color: tab === id ? '#fff' : C.muted, borderBottom: tab === id ? `2px solid ${C.accent}` : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: tab === id ? 'bold' : 'normal', whiteSpace: 'nowrap' }}>{lbl}</button>
        ))}
      </div>

      <div style={{ padding: '18px', maxWidth: '920px', margin: '0 auto' }}>
        {tab === 'edit-flower' && (
          <div>
            <button onClick={openNewFlower} style={{ background: C.accent, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '14px' }}>+ Add Flower Strain</button>
            {TIER_ORDER.map(tier => {
              const ts = sortItems(strains.filter(s => s.tiers?.[tier]?.active));
              if (!ts.length) return null;
              return (
                <div key={tier} style={{ marginBottom: '16px' }}>
                  <div style={{ background: '#2a2a45', color: C.text, fontWeight: 'bold', padding: '7px 12px', borderRadius: '4px 4px 0 0', fontSize: '12px', textTransform: 'uppercase' }}>{TIER_CFG[tier].label}</div>
                  <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
                    {ts.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: i % 2 === 0 ? C.panel : '#252540', borderBottom: `1px solid ${C.border}`, opacity: s.inStock === false ? 0.4 : 1 }}>
                        <span style={{ color: TU[s.type], fontWeight: 'bold', width: '16px' }}>{s.type}</span>
                        <span style={{ flex: 1, textDecoration: s.inStock === false ? 'line-through' : 'none' }}>{s.name}</span>
                        {tier === 'thirdParty' && <span style={{ color: C.muted, fontSize: '11px', width: '30px' }}>{s.tiers[tier].price}</span>}
                        <button onClick={() => toggleStock(s.id, false)} style={{ background: s.inStock === false ? '#4a4a6a' : '#2d5a2d', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', width: '70px' }}>{s.inStock === false ? 'Out' : 'In Stock'}</button>
                        <button onClick={() => openEdit(s, false)} style={{ background: '#35355a', color: C.text, border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                        <button onClick={() => deleteItem(s.id, false)} style={{ background: '#3a1f1f', color: '#e07070', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'edit-extracts' && (
          <div>
            <button onClick={openNewExtract} style={{ background: C.accent, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '14px' }}>+ Add Vape / Concentrate</button>
            {['vape', 'concentrate'].map(cat => {
              const ts = sortItems(extracts.filter(s => s.category === cat));
              if (!ts.length) return null;
              return (
                <div key={cat} style={{ marginBottom: '16px' }}>
                  <div style={{ background: '#2a2a45', color: C.text, fontWeight: 'bold', padding: '7px 12px', borderRadius: '4px 4px 0 0', fontSize: '12px', textTransform: 'uppercase' }}>{cat === 'vape' ? 'Disposables & Cartridges' : 'Concentrates'}</div>
                  <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
                    {ts.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: i % 2 === 0 ? C.panel : '#252540', borderBottom: `1px solid ${C.border}`, opacity: s.inStock === false ? 0.4 : 1 }}>
                        <span style={{ color: TU[s.type], fontWeight: 'bold', width: '16px' }}>{s.type}</span>
                        <span style={{ flex: 1, textDecoration: s.inStock === false ? 'line-through' : 'none' }}><strong>{s.brand}</strong> - {s.name}</span>
                        <span style={{ color: C.muted, fontSize: '11px', width: '100px' }}>{s.extract}{s.category === 'concentrate' && s.texture ? ` ${s.texture}` : ''}</span>
                        <span style={{ color: C.muted, fontSize: '11px', width: '30px' }}>{s.size}</span>
                        <button onClick={() => toggleStock(s.id, true)} style={{ background: s.inStock === false ? '#4a4a6a' : '#2d5a2d', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', width: '70px' }}>{s.inStock === false ? 'Out' : 'In Stock'}</button>
                        <button onClick={() => openEdit(s, true)} style={{ background: '#35355a', color: C.text, border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                        <button onClick={() => deleteItem(s.id, true)} style={{ background: '#3a1f1f', color: '#e07070', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {['eighths', 'halves', 'extracts'].includes(tab) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', background: C.panel, padding: '10px 16px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
             <div style={{ fontSize: '12px', color: C.good }}>✓ Ready to print</div>
            <button onClick={() => doPrint(tab)} style={{ background: C.accent, color: '#fff', border: 'none', padding: '8px 22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Open Print View</button>
          </div>
)}
      </div>

      {/* This renders the edit popup if it's active */}
      {editing && EditModal()}
      
    </div>
  );
}

