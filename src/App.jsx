import { useState, useEffect } from "react";

// ── Type colors ──────────────────────────────────────────────
const TC = { I: '#6B5B95', H: '#4A7A4A', S: '#B5651D' }; // print
const TU = { I: '#A99ED4', H: '#82C082', S: '#D9934A' }; // UI (lighter for dark bg)
const TO = { I: 0, H: 1, S: 2 };

// ── Tier config ──────────────────────────────────────────────
const TIER_CFG = {
  reserve: { 
    label: 'Reserve',
    eighthsHeader: 'PURLIFE RESERVE · 4g SUPER EIGHTHS',
    eighthsPrice: '1 for $20 · 4 for $70 · 8 for $135',
    halvesHeader: 'PURLIFE RESERVE · ½ oz',
    halvesPrice: '$40 each · 2 for $75' 
  },
  premium: { 
    label: 'Premium',
    eighthsHeader: 'PURLIFE PREMIUM · 4g SUPER EIGHTHS',
    eighthsPrice: '1 for $15 · 4 for $50 · 8 for $95',
    halvesHeader: 'PURLIFE PREMIUM · ½ oz',
    halvesPrice: '$40 each · 2 for $75' 
  },
  caliente: { 
    label: 'Caliente',
    eighthsHeader: 'CALIENTE BRAND · 3.5g',
    eighthsPrice: '$9 each',
    halvesHeader: 'CALIENTE BRAND · ½ oz',
    halvesPrice: '$30 each · 2 for $55' 
  },
  third: { 
    label: 'Third Party Flower',
    eighthsHeader: 'THIRD PARTY FLOWER · 3.5g · third-party',
    eighthsPrice: 'ask your budtender',
    halvesHeader: null,
    halvesPrice: null 
  },
};
const TIER_ORDER = ['reserve', 'premium', 'caliente', 'third'];

const mkId = () => Math.random().toString(36).slice(2, 9);

// ── Initial strain data ──────────────────────────────────────
const INITIAL_STRAINS = [
  { id: mkId(), tier: 'reserve', type: 'I', name: 'MK Ultra #3', thc: '30', lineage: 'G-13 × OG Kush', terpenes: 'Myrcene · Caryophyllene · Linalool', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Mystery Mix #5', thc: '33', lineage: 'Mystery Machine × Cake Mix', terpenes: 'Myrcene · Caryophyllene · Limonene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Banana Cake #20', thc: '31', lineage: 'Wedding Cake × Banana OG', terpenes: 'Myrcene · Limonene · Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Gush Mints', thc: '31', lineage: 'Gushers × Kush Mints', terpenes: 'Caryophyllene · Limonene · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: "Franco's Lemon Cheese #1", thc: '28', lineage: 'Lemon Skunk × Cheese', terpenes: 'Terpinolene · Myrcene · Ocimene', hasEighths: true, hasHalves: true, flags: { terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Sugar Cane #2', thc: '28', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Thug Roze × Mandarin Cookies', thc: '28', lineage: 'CA Black Rozé × Lilac Diesel / Forum Cookies × Mandarin Sunset', terpenes: 'Limonene · Myrcene · Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Vanilla Frosting #2', thc: '28', lineage: 'Gelato × Zkittlez (Humboldt)', terpenes: 'Limonene · Caryophyllene · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'CAP Junky × End Game #3', thc: '26', lineage: 'Alien Cookies F2 × Snowman cross', terpenes: '', hasEighths: true, hasHalves: true, flags: { terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'S', name: 'Acai Cookies', thc: '25', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Chocolate Waffle #10', thc: '25', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Don Mega', thc: '25', lineage: 'Big Buddha Cheese × Black Domina', terpenes: 'Myrcene · Caryophyllene · Pinene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Blue Zushi #4', thc: '23', lineage: 'Zkittlez × Gelato', terpenes: 'Limonene · Caryophyllene · Linalool', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'reserve', type: 'H', name: 'Lemon Cherry Pie #5', thc: '21', lineage: 'Lemon Cherry Gelato × Cherry Pie', terpenes: 'Limonene · Myrcene · Caryophyllene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'H', name: 'Almond Mochi', thc: '29', lineage: 'Almond Milk × Mochi', terpenes: 'Myrcene · Caryophyllene · Limonene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'H', name: 'HiFi 4G', thc: '25', lineage: 'White Fire OG cut', terpenes: 'Terpinolene · Myrcene · Ocimene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'H', name: 'Blue Zushi #4', thc: '24', lineage: 'Zkittlez × Gelato', terpenes: 'Limonene · Caryophyllene · Linalool', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'S', name: 'Dark Phoenix', thc: '22', lineage: 'Trainwreck × Jack Herer', terpenes: 'Terpinolene · Ocimene · Myrcene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'H', name: 'Don Mega', thc: '22', lineage: 'Big Buddha Cheese × Black Domina', terpenes: 'Myrcene · Caryophyllene · Pinene', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'I', name: 'MK Ultra #6', thc: '22', lineage: 'G-13 × OG Kush', terpenes: 'Myrcene · Caryophyllene · Linalool', hasEighths: true, hasHalves: true, flags: {}, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'H', name: 'Pepe Silvia #4', thc: '22', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blanks: {} },
  { id: mkId(), tier: 'premium', type: 'I', name: 'White Widow XXL', thc: '', lineage: '', terpenes: '', hasEigths: true, hasHalves: true, flags: { lineage: true, terpenes: true }, blans: {} },
];

// ── Helpers ──────────────────────────────────────────────────
const sortStrains = arr => [...arr].sort((a, b) => {
  const t = (TO[a.type] ?? 9) - (TO[b.type] ?? 9);
  return t !== 0 ? t : parseFloat(b.thc) - parseFloat(a.thc);
});
const isActive = (s, f) => s.flags[f] && !s.blanks[f];
const countFlags = (strains, menuType) =>
  strains
    .filter(s => menuType === 'eighths' ? s.hasEighths : s.hasHalves)
    .filter(s => ['lineage', 'terpenes'].some(f => isActive(s, f)))
    .length;

// ── Print HTML ───────────────────────────────────────────────
function buildPrintHtml(strains, menuType) {
  const relevant = strains.filter(s => menuType === 'eighths' ? s.hasEighths : s.hasHalves);
  const sections = TIER_ORDER.map(tier => {
    const cfg = TIER_CFG[tier];
    if (menuType === 'halves' && !cfg.halvesHeader) return null;
    const ts = sortStrains(relevant.filter(s => s.tier === tier));
    return ts.length ? { tier, cfg, strains: ts } : null;
  }).filter(Boolean);

  const isEighths = menuType === 'eighths';
  const cols = isEighths ? 4 : 5;
  const title = isEighths ? 'FLOWER — SUPER EIGHTHS (4g)' : 'FLOWER — HALF OUNCES (½ oz)';

  const colHdr = isEighths
    ? '<tr class="chdr"><th>TYPE</th><th>STRAIN · LINEAGE</th><th>THC</th><th>COMMONLY DOMINANT TERPENES</th></tr>'
    : '<tr class="chdr"><th>TYPE</th><th>STRAIN · LINEAGE</th><th>THC</th><th>PRICE</th><th>COMMONLY DOMINANT TERPENES</th></tr>';

  const tables = sections.map(sec => {
    const hdr = isEighths ? sec.cfg.eighthsHeader : sec.cfg.halvesHeader;
    const price = isEighths ? sec.cfg.eighthsPrice : sec.cfg.halvesPrice;
    const rowsHtml = sec.strains.map((s, i) => {
      const linVal = (s.flags.lineage && s.blanks.lineage) ? '' : (s.lineage || (s.flags.lineage ? '⚑' : ''));
      const terpVal = (s.flags.terpenes && s.blanks.terpenes) ? '' : (s.terpenes || (s.flags.terpenes ? '⚑' : ''));
      const bg = i % 2 === 0 ? '' : 'style="background:#ebebeb"';
      const nameCell = `<strong>${s.name}</strong>${linVal ? `<br><span class="lin">${linVal}</span>` : ''}`;
      if (isEighths) {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${s.thc}%</td><td class="terp">${terpVal}</td></tr>`;
      } else {
        return `<tr ${bg}><td class="tc" style="color:${TC[s.type]}">${s.type}</td><td>${nameCell}</td><td class="ctr">${s.thc}%</td><td class="ctr"><strong>$40</strong><br><span class="sub">2/$75</span></td><td class="terp">${terpVal}</td></tr>`;
      }
    }).join('');
    return `<table><thead><tr><td class="th-name" colspan="${cols}">${hdr}</td></tr><tr><td class="th-price" colspan="${cols}">${price}</td></tr>${colHdr}</thead><tbody>${rowsHtml}</tbody></table>`;
  }).join('');

  const footer2 = menuType === 'halves'
    ? `<div class="cal">CALIENTE BRAND · indoor/outdoor · <strong>$30 each</strong> · <strong>2 for $55</strong> · <em>Ask your budtender for current Caliente strains in stock</em></div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PurLife – ${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Helvetica,Arial,sans-serif;font-size:9pt;color:#1a1a1a;padding:.4in}
.store{font-size:18pt;font-weight:bold;text-align:center;margin-bottom:3px}
.ttl{font-size:12pt;font-weight:bold;text-align:center;color:#2e2e2e;margin-bottom:5px}
hr{border:none;border-top:1px solid #2e2e2e;margin-bottom:4px}
.leg{font-size:8pt;color:#555;text-align:center;margin-bottom:8px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
.th-name td{background:#2e2e2e;color:#fff;font-weight:bold;font-size:9pt;padding:5px 6px 2px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.th-price td{background:#2e2e2e;color:#fff;font-weight:bold;font-size:12pt;text-align:center;padding:2px 6px 6px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.chdr th{background:#e8e8e8;font-size:7pt;color:#555;padding:3px 5px;text-align:left;border-bottom:1px solid #888;font-weight:bold;print-color-adjust:exact;-webkit-print-color-adjust:exact}
tbody tr td{padding:3px 5px;border-bottom:1px solid #ccc;vertical-align:middle}
.tc{font-weight:bold;font-size:9.5pt;text-align:center;width:5%}
.ctr{text-align:center}
.lin{font-size:7pt;color:#555;font-style:italic}
.sub{font-size:7.5pt;color:#555}
.terp{font-size:7.5pt;width:${isEighths ? '47%' : '46%'}}
.cal{background:#555;color:#fff;padding:6px 8px;font-size:7.5pt;margin-top:4px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.foot{font-size:6.5pt;color:#888;text-align:center;border-top:.5px solid #aaa;padding-top:4px;margin-top:8px}
</style></head><body>
<div class="store">PURLIFE — HOBBS</div>
<div class="ttl">${title}</div><hr>
<div class="leg"><span style="color:${TC.I};font-weight:bold">I</span> Indica &nbsp;&nbsp; <span style="color:${TC.H};font-weight:bold">H</span> Hybrid &nbsp;&nbsp; <span style="color:${TC.S};font-weight:bold">S</span> Sativa</div>
${tables}${footer2}
<div class="foot">${isEighths ? 'All PurLife flower is 4g Super Eighths · Mix &amp; match tiers on 4 and 8 packs · ' : ''}THC% reflects current harvest and may vary · Terpene profiles are commonly dominant for these genetics — actual batch results may differ · Prices subject to change</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
}

// ── UI theme ─────────────────────────────────────────────────
const C = {
  bg: '#18182a',
  panel: '#21213a',
  border: '#35355a',
  text: '#ccc8e8',
  muted: '#7a77a0',
  accent: '#7c6fcd',
  danger: '#c05050',
  good: '#5a9a5a',
};

// ── Main app ─────────────────────────────────────────────────
export default function MenuApp() {
  const [strains, setStrains] = useState(INITIAL_STRAINS);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('edit');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  // LOAD FROM LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem('purlife-strains-v2');
    if (saved) {
      try {
        setStrains(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse strains from localStorage", e);
      }
    }
    setLoaded(true);
  }, []);

  // SAVE TO LOCALSTORAGE
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('purlife-strains-v2', JSON.stringify(strains));
  }, [strains, loaded]);

  const updateStrain = (id, up) => setStrains(p => p.map(s => s.id === id ? { ...s, ...up } : s));
  const deleteStrain = (id) => { if (window.confirm('Remove this strain?')) setStrains(p => p.filter(s => s.id !== id)); };
  const toggleBlank = (id, field) => setStrains(p => p.map(s => s.id === id ? { ...s, blanks: { ...s.blanks, [field]: !s.blanks[field] } } : s));

  const openEdit = (s) => { setEditing(s); setForm({ ...s }); };
  const openNew = () => {
    const blank = { id: mkId(), tier: 'reserve', type: 'H', name: '', thc: '', lineage: '', terpenes: '', hasEighths: true, hasHalves: true, flags: {}, blanks: {} };
    setEditing('new'); setForm(blank);
  };
  const saveForm = () => {
    const flags = { ...(form.lineage ? {} : { lineage: true }), ...(form.terpenes ? {} : { terpenes: true }) };
    const saved = { ...form, flags };
    if (editing === 'new') setStrains(p => [...p, saved]);
    else setStrains(p => p.map(s => s.id === form.id ? saved : s));
    setEditing(null);
  };

  const doPrint = (menuType) => {
    const html = buildPrintHtml(strains, menuType);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── Edit tab ───────────────────────────────────────────────
  const EditTab = () => (
    <div>
      <button onClick={openNew} style={{ background: C.accent, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '14px' }}>
        + Add Strain
      </button>
      {TIER_ORDER.map(tier => {
        const ts = sortStrains(strains.filter(s => s.tier === tier));
        if (!ts.length) return null;
        return (
          <div key={tier} style={{ marginBottom: '16px' }}>
            <div style={{ background: '#2a2a45', color: C.text, fontWeight: 'bold', padding: '7px 12px', borderRadius: '4px 4px 0 0', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {TIER_CFG[tier].label}
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
              {ts.map((s, i) => {
                const fc = ['lineage', 'terpenes'].filter(f => isActive(s, f)).length;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: i % 2 === 0 ? C.panel : '#252540', borderBottom: i < ts.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ color: TU[s.type], fontWeight: 'bold', fontSize: '13px', width: '16px', textAlign: 'center' }}>{s.type}</span>
                    <span style={{ flex: 1, color: C.text, fontSize: '13px', fontWeight: '500' }}>{s.name}</span>
                    <span style={{ color: C.muted, fontSize: '11px', width: '36px' }}>{s.thc}%</span>
                    {fc > 0 && <span style={{ color: '#e07070', fontSize: '11px', minWidth: '28px' }}>⚑ {fc}</span>}
                    <span style={{ color: C.muted, fontSize: '10px', minWidth: '22px' }}>
                      {[s.hasEighths && '⅛', s.hasHalves && '½'].filter(Boolean).join(' ')}
                    </span>
                    <button onClick={() => openEdit(s)} style={{ background: '#35355a', color: C.text, border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                    <button onClick={() => deleteStrain(s.id)} style={{ background: '#3a1f1f', color: '#e07070', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Edit modal ─────────────────────────────────────────────
  const EditModal = () => {
    if (!editing) return null;
    const inp = (field, type = 'text') => (
      <input type={type} value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width: '100%', background: '#14142a', border: `1px solid ${C.border}`, color: C.text, padding: '6px 8px', borderRadius: '3px', fontSize: '13px' }} />
    );
    const sel = (field, opts) => (
      <select value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width: '100%', background: '#14142a', border: `1px solid ${C.border}`, color: C.text, padding: '6px 8px', borderRadius: '3px', fontSize: '13px' }}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    );
    const lbl = (text) => <label style={{ display: 'block', color: C.muted, fontSize: '11px', marginBottom: '3px' }}>{text}</label>;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#1a1a2e', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '22px', width: '500px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
          <h3 style={{ color: C.text, marginBottom: '16px', fontSize: '15px' }}>{editing === 'new' ? 'Add Strain' : `Edit: ${editing.name || 'New Strain'}`}</h3>
          <div style={{ marginBottom: '10px' }}>{lbl('Strain Name')}{inp('name')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>{lbl('Type')}{sel('type', [['I', 'Indica'], ['H', 'Hybrid'], ['S', 'Sativa']])}</div>
            <div>{lbl('THC %')}{inp('thc')}</div>
            <div>{lbl('Tier')}{sel('tier', [['reserve', 'Reserve'], ['premium', 'Premium'], ['caliente', 'Caliente'], ['cookies', 'Cookies']])}</div>
          </div>
          <div style={{ marginBottom: '10px' }}>{lbl('Lineage')}{inp('lineage')}</div>
          <div style={{ marginBottom: '14px' }}>{lbl('Commonly Dominant Terpenes')}{inp('terpenes')}</div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '18px' }}>
            {[['hasEighths', 'In Eighths'], ['hasHalves', 'In Halves']].map(([f, l]) => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.text, cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={!!form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.checked }))} />
                {l}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifySelf: 'flex-end' }}>
            <button onClick={() => setEditing(null)} style={{ background: C.panel, color: C.muted, border: `1px solid ${C.border}`, padding: '7px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveForm} style={{ background: C.accent, color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Preview + flag handling ────────────────────────────────
  const PreviewMenu = ({ menuType }) => {
    const relevant = strains.filter(s => menuType === 'eighths' ? s.hasEighths : s.hasHalves);
    const sections = TIER_ORDER.map(tier => {
      const cfg = TIER_CFG[tier];
      if (menuType === 'halves' && !cfg.halvesHeader) return null;
      const ts = sortStrains(relevant.filter(s => s.tier === tier));
      return ts.length ? { tier, cfg, strains: ts } : null;
    }).filter(Boolean);

    const isEighths = menuType === 'eighths';
    const colHdrs = isEighths
      ? ['TYPE', 'STRAIN · LINEAGE', 'THC', 'COMMONLY DOMINANT TERPENES']
      : ['TYPE', 'STRAIN · LINEAGE', 'THC', 'PRICE', 'COMMONLY DOMINANT TERPENES'];

    const FlagBox = ({ strainId, field }) => (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        border: '2px solid #c05050', borderRadius: '3px',
        padding: '2px 7px', fontSize: '11px', color: '#c05050', fontWeight: '500',
        animation: 'flagblink 1.2s ease-in-out infinite',
        background: '#fff0ee'
      }}>
        ⚑ {field.toUpperCase()} UNVERIFIED
        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 'normal', color: '#555' }}>
          <input type="checkbox"
            checked={!!strains.find(s => s.id === strainId)?.blanks[field]}
            onChange={() => toggleBlank(strainId, field)}
            style={{ cursor: 'pointer' }}
          />
          leave blank
        </label>
      </span>
    );

    const thStyle = (w) => ({ fontSize: '8px', color: '#555', padding: '3px 6px', textAlign: 'left', borderBottom: '1px solid #888', fontWeight: 'bold', background: '#e8e8e8', width: w });
    const tdStyle = { padding: '3px 6px', borderBottom: '1px solid #ccc', verticalAlign: 'middle', fontSize: '12px' };

    return (
      <div style={{ fontFamily: 'Helvetica,Arial,sans-serif', fontSize: '12px', color: '#1a1a1a', background: 'white', padding: '18px', borderRadius: '6px' }}>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '19px', marginBottom: '2px' }}>PURLIFE — HOBBS</div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#333', marginBottom: '6px' }}>
          {isEighths ? 'FLOWER — SUPER EIGHTHS (4g)' : 'FLOWER — HALF OUNCES (½ oz)'}
        </div>
        <hr style={{ borderTop: '1px solid #2e2e2e', marginBottom: '4px' }} />
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#555', marginBottom: '10px' }}>
          {[['I', TC.I, 'Indica'], ['H', TC.H, 'Hybrid'], ['S', TC.S, 'Sativa']].map(([k, col, lbl]) => (
            <span key={k} style={{ marginRight: '16px' }}><span style={{ color: col, fontWeight: 'bold' }}>{k}</span> {lbl}</span>
          ))}
        </div>

        {sections.map(sec => {
          const header = isEighths ? sec.cfg.eighthsHeader : sec.cfg.halvesHeader;
          const price = isEighths ? sec.cfg.eighthsPrice : sec.cfg.halvesPrice;
          const cols = isEighths ? 4 : 5;
          return (
            <table key={sec.tier} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
                <tr><td colSpan={cols} style={{ background: '#2e2e2e', color: '#fff', fontWeight: 'bold', fontSize: '10px', padding: '5px 7px 2px' }}>{header}</td></tr>
                <tr><td colSpan={cols} style={{ background: '#2e2e2e', color: '#fff', fontWeight: 'bold', fontSize: '14px', textAlign: 'center', padding: '2px 7px 7px' }}>{price}</td></tr>
                <tr>{colHdrs.map((h, i) => <th key={i} style={thStyle(h === 'TYPE' ? '5%' : h === 'THC' ? '8%' : h === 'PRICE' ? '10%' : undefined)}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {sec.strains.map((s, i) => {
                  const linFlag = isActive(s, 'lineage');
                  const terpFlag = isActive(s, 'terpenes');
                  const linVal = (s.flags.lineage && s.blanks.lineage) ? '' : (s.lineage || '');
                  const terpVal = (s.flags.terpenes && s.blanks.terpenes) ? '' : (s.terpenes || '');
                  const rowBg = i % 2 === 0 ? '#fff' : '#ebebeb';
                  return (
                    <tr key={s.id} style={{ background: rowBg }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: TC[s.type], width: '5%' }}>{s.type}</td>
                      <td style={{ ...tdStyle }}>
                        <strong>{s.name}</strong>
                        {linFlag
                          ? <><br /><FlagBox strainId={s.id} field="lineage" /></>
                          : linVal ? <><br /><span style={{ fontSize: '10px', color: '#555', fontStyle: 'italic' }}>{linVal}</span></> : null
                        }
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', width: '8%' }}>{s.thc}%</td>
                      {!isEighths && (
                        <td style={{ ...tdStyle, textAlign: 'center', lineHeight: '1.4', width: '10%' }}>
                          <strong>$40</strong><br /><span style={{ fontSize: '9px', color: '#555' }}>2 for $75</span>
                        </td>
                      )}
                      <td style={{ ...tdStyle, fontSize: '10px' }}>
                        {terpFlag ? <FlagBox strainId={s.id} field="terpenes" /> : <span>{terpVal}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })}

        {!isEighths && (
          <div style={{ background: '#555', color: '#fff', padding: '7px 10px', fontSize: '10px', marginTop: '4px', borderRadius: '2px' }}>
            <strong>CALIENTE BRAND</strong> · indoor/outdoor · <strong>$30 each</strong> · <strong>2 for $55</strong> · <em>Ask your budtender for current Caliente strains in stock</em>
          </div>
        )}
        <div style={{ fontSize: '8px', color: '#888', textAlign: 'center', borderTop: '0.5px solid #aaa', paddingTop: '4px', marginTop: '8px' }}>
          {isEighths && 'All PurLife flower is 4g Super Eighths · Mix & match tiers on 4 and 8 packs · '}
          THC% reflects current harvest and may vary · Terpene profiles are commonly dominant for these genetics — actual batch results may differ · Prices subject to change
        </div>
      </div>
    );
  };

  const fc8 = countFlags(strains, 'eighths');
  const fch = countFlags(strains, 'halves');
  const curFlags = tab === 'eighths' ? fc8 : tab === 'halves' ? fch : 0;

  const Badge = ({ n }) => n > 0
    ? <span style={{ background: C.danger, color: '#fff', borderRadius: '10px', fontSize: '10px', padding: '1px 6px', marginLeft: '5px', fontWeight: 'bold' }}>{n} ⚑</span>
    : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui,sans-serif', color: C.text }}>
      <style>{`@keyframes flagblink{0%,100%{border-color:#c05050;background:#fff0ee}50%{border-color:#ff7070;background:#ffe8e6}}`}</style>

      {/* Header */}
      <div style={{ background: '#12122a', borderBottom: `1px solid ${C.border}`, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.5px' }}>PURLIFE — HOBBS</div>
          <div style={{ fontSize: '11px', color: C.muted }}>Strain Menu Manager</div>
        </div>
        <div style={{ fontSize: '11px', color: C.muted }}>{strains.length} strains in database</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#12122a' }}>
        {[['edit', 'Edit Strains', 0], ['eighths', 'Eighths Preview', fc8], ['halves', 'Halves Preview', fch]].map(([id, lbl, fc]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            color: tab === id ? '#fff' : C.muted,
            borderBottom: tab === id ? `2px solid ${C.accent}` : '2px solid transparent',
            cursor: 'pointer', fontSize: '13px', fontWeight: tab === id ? 'bold' : 'normal',
            display: 'flex', alignItems: 'center'
          }}>
            {lbl}<Badge n={fc} />
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '18px', maxWidth: '920px', margin: '0 auto' }}>
        {tab === 'edit' && <EditTab />}

        {(tab === 'eighths' || tab === 'halves') && (<>
          {/* Print controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', background: C.panel, padding: '10px 16px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '12px', color: curFlags > 0 ? '#e07070' : C.good }}>
              {curFlags > 0
                ? `⚑ ${curFlags} item${curFlags > 1 ? 's' : ''} flagged — check "leave blank" on each or resolve data first`
                : '✓ All clear — ready to print'}
            </div>
            <button onClick={() => doPrint(tab)} style={{
              background: curFlags > 0 ? '#4a2020' : C.accent, color: '#fff', border: 'none',
              padding: '8px 22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
            }}>
              {curFlags > 0 ? 'Print Anyway' : 'Print'}
            </button>
          </div>
          <PreviewMenu menuType={tab} />
        </>)}
      </div>

      {editing && <EditModal />}
    </div>
  );
}
