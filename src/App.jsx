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

// ── Initial Data ─────────────────────────────────────────────
const INITIAL_STRAINS = [
  { id: mkId(), tier: 'reserve', type: 'I', name: 'MK Ultra #3', thc: '30', lineage: 'G-13 × OG Kush', terpenes: 'Myrcene · Caryophyllene · Linalool', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'thirdParty', type: 'S', name: 'Mexican Flan', thc: '35', price: '$45', lineage: 'Cookies Brand', terpenes: '', hasEighths: true, hasHalves: false, flags: { terpenes: true }, blanks: {} }
];

const INITIAL_EXTRACTS = [
  { id: mkId(), category: 'vape', type: 'H', brand: 'Purlife', name: 'Blue Dream', extract: 'Distillate', texture: '', size: '1g', price: '$35', hasBattery: true },
  { id: mkId(), category: 'vape', type: 'S', brand: 'Cookies', name: 'Gary Payton', extract: 'Live Resin', texture: '', size: '0.5g', price: '$45', hasBattery: false },
  { id: mkId(), category: 'concentrate', type: 'I', brand: 'DabCo', name: 'OG Kush', extract: 'Cured Resin', texture: 'Badder', size: '1g', price: '$30', hasBattery: false }
];

// ── Helpers ──────────────────────────────────────────────────
const sortItems = arr => [...arr].sort((a, b) => (TO[a.type] ?? 9) - (TO[b.type] ?? 9));
const isActive = (s, f) => s.flags && s.flags[f] && s.blanks && !s.blanks[f];
const countFlags = (strains, menuType) =>
  strains
    .filter(s => menuType === 'eighths' ? s.hasEighths : s.hasHalves)
    .filter(s => ['lineage', 'terpenes'].some(f => isActive(s, f)))
    .length;

// ── Print HTML Builders ──────────────────────────────────────
function buildFlowerHtml(strains, menuType) {
  const relevant = strains.filter(s => menuType === 'eighths' ? s.hasEighths : s.hasHalves);
  const sections = TIER_ORDER.map(tier => {
    const cfg = TIER_CFG[tier];
    if (menuType === 'halves' && !cfg.halvesHeader) return null;
    const ts = sortItems(relevant.filter(s => s.tier === tier));
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
      const linVal = (s.flags.lineage && s.blanks.lineage) ? '' : (s.lineage || (s.flags.lineage ? '⚑' : ''));
      const terpVal = (s.flags.terpenes && s.blanks.terpenes) ? '' : (s.terpenes || (s.flags.terpenes ? '⚑' : ''));
      const bg = i % 2 === 0 ? '' : 'style="background:#ebebeb"';
      const nameCell = `<strong>${s.name}</strong>${linVal ? `<br><span class="lin">${linVal}</span>` : ''}`;
      
      if (isEighths && !isThirdParty) {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${s.thc}%</td><td class="terp">${terpVal}</td></tr>`;
      } else if (isEighths && isThirdParty) {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${s.thc}%</td><td class="ctr"><strong>${s.price || ''}</strong></td><td class="terp">${terpVal}</td></tr>`;
      } else {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${s.thc}%</td><td class="ctr"><strong>$40</strong><br><span class="sub">2/$75</span></td><td class="terp">${terpVal}</td></tr>`;
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
  const vapes = sortItems(extracts.filter(e => e.category === 'vape'));
  const concentrates = sortItems(extracts.filter(e => e.category === 'concentrate'));

  const buildRows = (items, isVape) => items.map((s, i) => {
    const bg = i % 2 === 0 ? '' : 'style="background:#ebebeb"';
    const batCell = isVape ? `<td class="ctr">${s.hasBattery ? '✓' : ''}</td>` : '';
    const extVal = isVape ? s.extract : `${s.extract} ${s.texture || ''}`.trim();
    
    return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td><strong>${s.brand}</strong></td><td>${s.name}</td><td>${extVal}</td><td class="ctr">${s.size}</td><td class="ctr"><strong>${s.price}</strong></td>${batCell}</tr>`;
  }).join('');

  const vapesTable = vapes.length ? `<table><thead><tr><td class="th-name" colspan="7">DISPOSABLES & CARTRIDGES</td></tr>
    <tr class="chdr"><th>TYPE</th><th>BRAND</th><th>STRAIN / FLAVOR</th><th>EXTRACT TYPE</th><th>SIZE</th><th>PRICE</th><th>BATTERY</th></tr></thead><tbody>${buildRows(vapes, true)}</tbody></table>` : '';

  const concTable = concentrates.length ? `<table><thead><tr><td class="th-name" colspan="6">CONCENTRATES</td></tr>
    <tr class="chdr"><th>TYPE</th><th>BRAND</th><th>STRAIN</th><th>EXTRACT TYPE</th><th>SIZE</th><th>PRICE</th></tr></thead><tbody>${buildRows(concentrates, false)}</tbody></table>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PurLife – Extracts & Vapes</title>
<style>
*{margin:0;padding:0;box-sizing:border-box} body{font-family:Helvetica,Arial,sans-serif;font-size:9pt;color:#1a1a1a;padding:.4in}
.store{font-size:18pt;font-weight:bold;text-align:center;margin-bottom:3px} .ttl{font-size:12pt;font-weight:bold;text-align:center;color:#2e2e2e;margin-bottom:5px}
hr{border:none;border-top:1px solid #2e2e2e;margin-bottom:4px} .leg{font-size:8pt;color:#555;text-align:center;margin-bottom:8px}
table{width:100%;border-collapse:collapse;margin-bottom:15px}
.th-name td{background:#2e2e2e;color:#fff;font-weight:bold;font-size:12pt;padding:5px 6px;text-align:center;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.chdr th{background:#e8e8e8;font-size:7pt;color:#555;padding:3px 5px;text-align:left;border-bottom:1px solid #888;font-weight:bold;print-color-adjust:exact;-webkit-print-color-adjust:exact}
tbody tr td{padding:5px;border-bottom:1px solid #ccc;vertical-align:middle}
.tc{font-weight:bold;font-size:9.5pt;text-align:center;width:5%} .ctr{text-align:center}
.foot{font-size:6.5pt;color:#888;text-align:center;border-top:.5px solid #aaa;padding-top:4px;margin-top:8px}
</style></head><body>
<div class="store">PURLIFE — HOBBS</div><div class="ttl">EXTRACTS & VAPES</div><hr>
<div class="leg"><span style="color:${TC.I};font-weight:bold">I</span> Indica &nbsp;&nbsp; <span style="color:${TC.H};font-weight:bold">H</span> Hybrid &nbsp;&nbsp; <span style="color:${TC.S};font-weight:bold">S</span> Sativa</div>
${vapesTable}${concTable}
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

  // LOAD FROM LOCALSTORAGE
  useEffect(() => {
    const savedStrains = localStorage.getItem('purlife-strains-v2');
    const savedExtracts = localStorage.getItem('purlife-extracts-v2');
    if (savedStrains) try { setStrains(JSON.parse(savedStrains)); } catch (e) { }
    if (savedExtracts) try { setExtracts(JSON.parse(savedExtracts)); } catch (e) { }
    setLoaded(true);
  }, []);

  // SAVE TO LOCALSTORAGE
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('purlife-strains-v2', JSON.stringify(strains));
    localStorage.setItem('purlife-extracts-v2', JSON.stringify(extracts));
  }, [strains, extracts, loaded]);

  const deleteItem = (id, isExtract) => {
    if (window.confirm('Remove this item?')) {
      if (isExtract) setExtracts(p => p.filter(s => s.id !== id));
      else setStrains(p => p.filter(s => s.id !== id));
    }
  };
  const toggleBlank = (id, field) => setStrains(p => p.map(s => s.id === id ? { ...s, blanks: { ...s.blanks, [field]: !s.blanks[field] } } : s));

  const openEdit = (s, isExtract) => { setEditing({ ...s, isExtract }); setForm({ ...s }); };
  const openNewFlower = () => { setEditing({ isNew: true, isExtract: false }); setForm({ id: mkId(), tier: 'reserve', type: 'H', name: '', thc: '', price: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: {}, blanks: {} }); };
  const openNewExtract = () => { setEditing({ isNew: true, isExtract: true }); setForm({ id: mkId(), category: 'vape', type: 'H', brand: '', name: '', extract: 'Distillate', texture: '', size: '1g', price: '', hasBattery: false }); };

  const saveForm = () => {
    if (editing.isExtract) {
      if (editing.isNew) setExtracts(p => [...p, form]);
      else setExtracts(p => p.map(s => s.id === form.id ? form : s));
    } else {
      const flags = { ...(form.lineage ? {} : { lineage: true }), ...(form.terpenes ? {} : { terpenes: true }) };
      const saved = { ...form, flags };
      if (editing.isNew) setStrains(p => [...p, saved]);
      else setStrains(p => p.map(s => s.id === form.id ? saved : s));
    }
    setEditing(null);
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
    const lbl = (text) => <label style={{ display: 'block', color: C.muted, fontSize: '11px', marginBottom: '3px' }}>{text}</label>;
    
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#1a1a2e', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '22px', width: '500px', maxWidth: '95vw' }}>
          <h3 style={{ color: C.text, marginBottom: '16px', fontSize: '15px' }}>{editing.isNew ? 'Add Item' : `Edit: ${form.name}`}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
            <div>{lbl('Type')}{sel('type', [['I', 'Indica'], ['H', 'Hybrid'], ['S', 'Sativa']])}</div>
            <div>{lbl(editing.isExtract ? 'Strain / Flavor Name' : 'Strain Name')}{inp('name')}</div>
          </div>

          {!editing.isExtract && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>{lbl('THC %')}{inp('thc')}</div>
                <div>{lbl('Tier')}{sel('tier', [['reserve', 'Reserve'], ['premium', 'Premium'], ['caliente', 'Caliente'], ['thirdParty', 'Third Party']])}</div>
              </div>
              
              {form.tier === 'thirdParty' && (
                <div style={{ marginBottom: '10px' }}>{lbl('Price (e.g. $45)')}{inp('price')}</div>
              )}

              <div style={{ marginBottom: '10px' }}>{lbl('Lineage')}{inp('lineage')}</div>
              <div style={{ marginBottom: '14px' }}>{lbl('Dominant Terpenes')}{inp('terpenes')}</div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '18px' }}>
                {[['hasEighths', 'In Eighths'], ['hasHalves', 'In Halves']].map(([f, l]) => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.text, cursor: 'pointer', fontSize: '13px' }}><input type="checkbox" checked={!!form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.checked }))} />{l}</label>
                ))}
              </div>
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

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(null)} style={{ background: C.panel, color: C.muted, border: `1px solid ${C.border}`, padding: '7px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveForm} style={{ background: C.accent, color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────
  const fc8 = countFlags(strains, 'eighths');
  const fch = countFlags(strains, 'halves');
  const curFlags = tab === 'eighths' ? fc8 : tab === 'halves' ? fch : 0;

  const Badge = ({ n }) => n > 0 ? <span style={{ background: C.danger, color: '#fff', borderRadius: '10px', fontSize: '10px', padding: '1px 6px', marginLeft: '5px', fontWeight: 'bold' }}>{n} ⚑</span> : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui,sans-serif', color: C.text }}>
      <div style={{ background: '#12122a', borderBottom: `1px solid ${C.border}`, padding: '12px 18px', display: 'flex', justifyContent: 'space-between' }}>
        <div><div style={{ fontWeight: 'bold', fontSize: '15px' }}>PURLIFE — HOBBS</div><div style={{ fontSize: '11px', color: C.muted }}>Menu Manager v2</div></div>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#12122a', overflowX: 'auto' }}>
        {[['edit-flower', 'Edit Flower', 0], ['edit-extracts', 'Edit Extracts', 0], ['eighths', 'Print Eighths', fc8], ['halves', 'Print Halves', fch], ['extracts', 'Print Extracts', 0]].map(([id, lbl, fc]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 18px', border: 'none', background: 'transparent', color: tab === id ? '#fff' : C.muted, borderBottom: tab === id ? `2px solid ${C.accent}` : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: tab === id ? 'bold' : 'normal', whiteSpace: 'nowrap' }}>{lbl}<Badge n={fc} /></button>
        ))}
      </div>

      <div style={{ padding: '18px', maxWidth: '920px', margin: '0 auto' }}>
        {tab === 'edit-flower' && (
          <div>
            <button onClick={openNewFlower} style={{ background: C.accent, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '14px' }}>+ Add Flower Strain</button>
            {TIER_ORDER.map(tier => {
              const ts = sortItems(strains.filter(s => s.tier === tier));
              if (!ts.length) return null;
              return (
                <div key={tier} style={{ marginBottom: '16px' }}>
                  <div style={{ background: '#2a2a45', color: C.text, fontWeight: 'bold', padding: '7px 12px', borderRadius: '4px 4px 0 0', fontSize: '12px', textTransform: 'uppercase' }}>{TIER_CFG[tier].label}</div>
                  <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
                    {ts.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: i % 2 === 0 ? C.panel : '#252540', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: TU[s.type], fontWeight: 'bold', width: '16px' }}>{s.type}</span>
                        <span style={{ flex: 1 }}>{s.name}</span>
                        {s.tier === 'thirdParty' && <span style={{ color: C.muted, fontSize: '11px', width: '30px' }}>{s.price}</span>}
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
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: i % 2 === 0 ? C.panel : '#252540', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: TU[s.type], fontWeight: 'bold', width: '16px' }}>{s.type}</span>
                        <span style={{ flex: 1 }}><strong>{s.brand}</strong> - {s.name}</span>
                        <span style={{ color: C.muted, fontSize: '11px', width: '100px' }}>{s.extract}{s.category === 'concentrate' && s.texture ? ` ${s.texture}` : ''}</span>
                        <span style={{ color: C.muted, fontSize: '11px', width: '30px' }}>{s.size}</span>
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
             <div style={{ fontSize: '12px', color: curFlags > 0 ? '#e07070' : C.good }}>{curFlags > 0 ? `⚑ ${curFlags} unverified flags in flower data` : '✓ Ready to print'}</div>
            <button onClick={() => doPrint(tab)} style={{ background: C.accent, color: '#fff', border: 'none', padding: '8px 22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Open Print View</button>
          </div>
        )}
      </div>

      {editing && EditModal()}
    </div>
  );
}
