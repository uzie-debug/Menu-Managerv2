import { useState, useEffect } from "react";
import { supabase, STRAIN_SELECT, strainFromDb, strainToDb, extractFromDb, extractToDb } from './supabaseClient';
import { useAuth } from './AuthContext';
import { describeDbError } from './dbError';
import Login from './Login';
import { C, TAP } from './theme';


// ── Type colors ──────────────────────────────────────────────
const TC = { I: '#6B5B95', H: '#4A7A4A', S: '#B5651D' }; // print
const TU = { I: '#A99ED4', H: '#82C082', S: '#D9934A' }; // UI
const TO = { I: 0, H: 1, S: 2 };

// ── Alphabet bands ───────────────────────────────────────────
// Strains group into four bands instead of the old tiers. Bands are a UI
// affordance only; nothing in the database knows about them.
const BANDS = [
  { id: 'A-H', label: 'A–H', test: c => c >= 'A' && c <= 'H' },
  { id: 'I-N', label: 'I–N', test: c => c >= 'I' && c <= 'N' },
  { id: 'O-U', label: 'O–U', test: c => c >= 'O' && c <= 'U' },
  { id: 'V-Z', label: 'V–Z', test: c => c >= 'V' && c <= 'Z' },
  // Names starting with a digit or symbol have to land somewhere.
  { id: '#',   label: '#',   test: () => true },
];

const bandOf = (name) => {
  const c = (name || '').trim().charAt(0).toUpperCase();
  return BANDS.find(b => b.test(c)).id;
};

const mkId = () => Math.random().toString(36).slice(2, 9);

const money = (v) => (v === '' || v == null ? '' : `$${Number(v).toFixed(2).replace(/\.00$/, '')}`);

// Print output is built as an HTML string, so anything from the database has
// to be escaped on the way in. Strain names contain apostrophes and ×.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));


// ── Helpers ──────────────────────────────────────────────────
const sortItems = arr => [...arr].sort((a, b) => (TO[a.type] ?? 9) - (TO[b.type] ?? 9));

// ── Print HTML Builders ──────────────────────────────────────
// Takes rows straight out of v_print_menu (one row per strain per weight)
// for a single print_page, and renders one table per subheader.
//
// The page layout is data, not code: grouping comes from print_page /
// print_subhead / weight_sort in weight_options. Moving quarters onto their
// own page is a row edit in that table, not a change here.
function buildFlowerHtml(rows, pageId, pageTitle) {
  // A row with a weight but no price would print a blank price cell on a
  // customer-facing menu. Drop it here and count it, so the app can warn
  // before anything reaches the printer.
  const pageRows = rows.filter(r =>
    r.print_page === pageId && r.in_stock !== false && r.price != null);

  // null subhead prints first, then the rest in weight_sort order.
  const subheads = [];
  for (const r of pageRows.slice().sort((a, b) => a.weight_sort - b.weight_sort)) {
    const key = r.print_subhead ?? null;
    if (!subheads.some(s => s.key === key)) subheads.push({ key, label: r.print_subhead });
  }

  const tables = subheads.map(sub => {
    const items = pageRows
      .filter(r => (r.print_subhead ?? null) === sub.key)
      .sort((a, b) =>
        (a.weight_sort - b.weight_sort) ||
        (TO[a.type] ?? 9) - (TO[b.type] ?? 9) ||
        a.name.localeCompare(b.name)
      );
    if (!items.length) return '';

    const rowsHtml = items.map((r, i) => {
      const bg = i % 2 === 0 ? '' : 'style="background:#ebebeb"';
      const nameCell = `<strong>${esc(r.name)}</strong>${r.lineage ? `<br><span class="lin">${esc(r.lineage)}</span>` : ''}`;
      const thcStr = r.thc == null ? '' : `${r.thc}%`;
      return `<tr ${bg}><td class="tc" style="color:${TC[r.type]}">${esc(r.type)}</td><td>${nameCell}</td><td class="ctr">${thcStr}</td><td class="ctr"><strong>${money(r.price)}</strong></td><td class="terp">${esc(r.terpenes || '')}</td></tr>`;
    }).join('');

    const head = sub.label
      ? `<tr><td class="th-name" colspan="5">${esc(sub.label.toUpperCase())}</td></tr>`
      : '';
    return `<table><thead>${head}<tr class="chdr"><th>TYPE</th><th>STRAIN · LINEAGE</th><th>THC</th><th>PRICE</th><th>COMMONLY DOMINANT TERPENES</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
  }).join('');

  const body = tables || '<p style="text-align:center;color:#888;padding:40px 0">Nothing in stock for this page.</p>';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PurLife – ${esc(pageTitle)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box} body{font-family:Helvetica,Arial,sans-serif;font-size:9pt;color:#1a1a1a;padding:.4in}
.store{font-size:18pt;font-weight:bold;text-align:center;margin-bottom:3px} .ttl{font-size:12pt;font-weight:bold;text-align:center;color:#2e2e2e;margin-bottom:5px}
hr{border:none;border-top:1px solid #2e2e2e;margin-bottom:4px} .leg{font-size:8pt;color:#555;text-align:center;margin-bottom:8px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
.th-name td,td.th-name{background:#2e2e2e;color:#fff;font-weight:bold;font-size:10pt;padding:5px 6px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.chdr th{background:#e8e8e8;font-size:7pt;color:#555;padding:3px 5px;text-align:left;border-bottom:1px solid #888;font-weight:bold;print-color-adjust:exact;-webkit-print-color-adjust:exact}
tbody tr td{padding:3px 5px;border-bottom:1px solid #ccc;vertical-align:middle}
.tc{font-weight:bold;font-size:9.5pt;text-align:center;width:5%} .ctr{text-align:center}
.lin{font-size:7pt;color:#555;font-style:italic} .terp{font-size:7.5pt;width:46%}
.foot{font-size:6.5pt;color:#888;text-align:center;border-top:.5px solid #aaa;padding-top:4px;margin-top:8px}
</style></head><body>
<div class="store">PURLIFE — HOBBS</div><div class="ttl">${esc(pageTitle)}</div><hr>
<div class="leg"><span style="color:${TC.I};font-weight:bold">I</span> Indica &nbsp;&nbsp; <span style="color:${TC.H};font-weight:bold">H</span> Hybrid &nbsp;&nbsp; <span style="color:${TC.S};font-weight:bold">S</span> Sativa</div>
${body}
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

// A number cell that edits in place. Keeps its own draft so typing stays
// responsive, and only calls onCommit on blur or Enter — one write per field
// rather than one per keystroke.
function InlineCell({ value, onCommit, prefix = '', suffix = '', width = 56 }) {
  const [draft, setDraft] = useState(value);
  // Re-sync when the row changes underneath (a rolled-back write, a reload).
  useEffect(() => { setDraft(value); }, [value]);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
      {prefix && <span style={{ color: C.muted, fontSize: 11 }}>{prefix}</span>}
      <input
        type="number" inputMode="decimal" step="0.01" min="0"
        value={draft} placeholder="—"
        onChange={e => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        style={{
          // A fixed width plus border-box: number inputs carry a wide
          // intrinsic size, and without this they refuse to shrink and push
          // into the neighbouring grid column.
          width, minWidth: 0, boxSizing: 'border-box',
          background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 3, color: C.text, padding: '4px 6px',
          fontSize: 13, textAlign: 'center',
          // Spinners eat horizontal space and are useless on a touch screen.
          appearance: 'textfield', MozAppearance: 'textfield',
        }}
      />
      {suffix && <span style={{ color: C.muted, fontSize: 11 }}>{suffix}</span>}
    </span>
  );
}

// ── Main app ─────────────────────────────────────────────────
export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, color: C.muted,
        fontFamily: 'system-ui,sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
      }}>Loading…</div>
    );
  }

  // Anon reads are gone — without a session every query returns zero rows, so
  // there is nothing useful to render behind this gate.
  if (!session) return <Login />;

  return <MenuApp />;
}

function MenuApp() {
  const { user, isMenuEditor, signOut } = useAuth();
  const [strains, setStrains] = useState([]);
  const [extracts, setExtracts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState('edit-flower');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showHelp, setShowHelp] = useState(false);

  // Lookup tables. These drive the brand picker and the weight checkboxes, so
  // adding a weight or a brand is a row edit rather than a code change.
  const [brands, setBrands] = useState([]);
  const [weightOptions, setWeightOptions] = useState([]);

  // Collapsible alphabet bands. Everything starts open.
  const [collapsed, setCollapsed] = useState({});
  const toggleBand = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  // Last write failure, shown as a banner. The database is the real gate, so
  // a viewer who gets past the UI still lands here with a 42501.
  const [saveError, setSaveError] = useState(null);
  const reportWrite = (error) => setSaveError(describeDbError(error));

  const importBackup = () => {
    // Create an invisible file upload input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    // When the user selects a file, read it
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          // This wipes and replaces both tables. Given there is no undo, make
          // the operator say yes twice.
          if (!window.confirm('This DELETES every strain and extract in the cloud and replaces them with the file. Continue?')) return;
          const data = JSON.parse(event.target.result);
          const importedStrains = data.strains ?? [];
          const importedExtracts = (data.extracts ?? []).map(s => ({ ...s, inStock: s.inStock !== false }));

          // Backups written before the schema change carry a `tiers` object
          // and no `weights`. Those cannot be restored — refuse rather than
          // silently importing strains with no prices.
          if (importedStrains.some(s => s.tiers && !s.weights)) {
            alert('This backup is from the old tier format and cannot be imported. Prices now live per weight.');
            return;
          }

          if (importedStrains.length) {
            await supabase.from('strains').delete().neq('id', '');
            const { error } = await supabase.from('strains').upsert(importedStrains.map(strainToDb));
            if (error) throw error;
            for (const s of importedStrains) {
              const wErr = await saveWeights(s.id, s.weights ?? {});
              if (wErr) throw wErr;
            }
            setStrains(importedStrains);
          }
          if (importedExtracts.length) {
            await supabase.from('extracts').delete().neq('id', '');
            const { error } = await supabase.from('extracts').upsert(importedExtracts.map(extractToDb));
            if (error) throw error;
            setExtracts(importedExtracts);
          }
          alert('Backup imported and synced to cloud.');
        } catch (err) {
          console.error('Import failed:', err);
          alert(describeDbError(err) ?? 'Error reading backup file. Make sure it is a valid JSON backup.');
        }
      };
      reader.readAsText(file);
    };
    
    // Trigger the invisible input
    input.click();
  };

  // LOAD FROM SUPABASE
  //
  // Supabase is the only source of truth now. The old seed-on-empty and
  // localStorage-fallback branches are gone on purpose: with RLS on, an
  // unauthorised read returns [] rather than an error, and the old code read
  // that as "database is empty, push the seeds" — which would overwrite the
  // real strain table with the hardcoded sample data.
  useEffect(() => {
    const loadData = async () => {
      const [s, e, b, w] = await Promise.all([
        // Embedded select — one round trip gets each strain with its weights
        // and their prices.
        supabase.from('strains').select(STRAIN_SELECT).eq('archived', false).order('name'),
        supabase.from('extracts').select('*').order('name'),
        supabase.from('brands').select('*').order('sort_order'),
        supabase.from('weight_options').select('*').order('sort_order'),
      ]);
      const err = s.error || e.error || b.error || w.error;
      if (err) {
        console.error('Supabase load failed:', err);
        setLoadError('Could not load the menu. Check your connection and reload.');
      } else {
        setStrains((s.data ?? []).map(strainFromDb));
        setExtracts((e.data ?? []).map(extractFromDb));
        setBrands(b.data ?? []);
        setWeightOptions(w.data ?? []);
      }
      setLoaded(true);
    };
    loadData();
  }, []);

  const deleteItem = (id, isExtract) => {
    if (window.confirm('Remove this item entirely? (Hint: You can just mark it "Out of Stock" instead!)')) {
      const table = isExtract ? 'extracts' : 'strains';
      if (isExtract) setExtracts(p => p.filter(s => s.id !== id));
      else setStrains(p => p.filter(s => s.id !== id));
      supabase.from(table).delete().eq('id', id).then(({ error }) => {
        if (error) console.error(`Delete from ${table} failed:`, error);
      });
    }
  };

  // Stock is the one field every login may change, so it is optimistic:
  // flip locally, then persist, then roll back if the database says no.
  const toggleStock = async (id, isExtract) => {
    const list = isExtract ? extracts : strains;
    const setList = isExtract ? setExtracts : setStrains;
    const current = list.find(s => s.id === id);
    if (!current) return;
    const next = current.inStock === false;

    setList(p => p.map(s => s.id === id ? { ...s, inStock: next } : s));
    const { error } = await supabase
      .from(isExtract ? 'extracts' : 'strains')
      .update({ in_stock: next })
      .eq('id', id);
    if (error) {
      setList(p => p.map(s => s.id === id ? { ...s, inStock: !next } : s));
      reportWrite(error);
    }
  };

  const openEdit = (s, isExtract) => { setEditing({ ...s, isExtract }); setForm({ ...s }); };

  // ── Inline, per-row saves ─────────────────────────────────
  // Bulk data entry goes through these, not the modal: tab across the row,
  // type, move on. Writes fire on blur rather than on every keystroke.
  const saveStrainField = async (id, field, value) => {
    const before = strains.find(s => s.id === id);
    if (!before || before[field] === value) return;
    setStrains(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));
    const { error } = await supabase
      .from('strains')
      .update(strainToDb({ ...before, [field]: value }))
      .eq('id', id);
    if (error) {
      setStrains(p => p.map(s => s.id === id ? before : s));
      reportWrite(error);
    }
  };

  const saveWeightPrice = async (id, weight, value) => {
    const before = strains.find(s => s.id === id);
    if (!before || before.weights[weight] === value) return;
    setStrains(p => p.map(s => s.id === id
      ? { ...s, weights: { ...s.weights, [weight]: value } } : s));
    const { error } = await supabase.from('strain_weights').upsert({
      strain_id: id, weight, price: value === '' ? null : Number(value),
    });
    if (error) {
      setStrains(p => p.map(s => s.id === id ? before : s));
      reportWrite(error);
    }
  };

  const openNewFlower = () => {
    setEditing({ isNew: true, isExtract: false });
    setForm({
      id: mkId(), type: 'H', name: '', lineage: '', terpenes: '',
      brandId: brands[0]?.id ?? '', thc: '', cbd: '', inStock: true, weights: {},
    });
  };

  const openNewExtract = () => { setEditing({ isNew: true, isExtract: true }); setForm({ id: mkId(), category: 'vape', type: 'H', brand: '', name: '', extract: 'Distillate', texture: '', size: '1g', price: '', hasBattery: false, inStock: true }); };

  // Reconciles form.weights against what is already in strain_weights:
  // checking a weight inserts a row, unchecking deletes it, and an edited
  // price updates in place. Prices only ever live here, never on `strains`.
  const saveWeights = async (strainId, weights) => {
    const before = strains.find(s => s.id === strainId)?.weights ?? {};
    const wanted = Object.keys(weights);
    const dropped = Object.keys(before).filter(w => !wanted.includes(w));

    if (dropped.length) {
      const { error } = await supabase
        .from('strain_weights').delete()
        .eq('strain_id', strainId).in('weight', dropped);
      if (error) return error;
    }
    if (wanted.length) {
      const { error } = await supabase.from('strain_weights').upsert(
        wanted.map(w => ({
          strain_id: strainId,
          weight: w,
          price: weights[w] === '' ? null : Number(weights[w]),
        }))
      );
      if (error) return error;
    }
    return null;
  };

  const saveForm = async () => {
    if (editing.isExtract) {
      const { error } = await supabase.from('extracts').upsert(extractToDb(form));
      if (error) return reportWrite(error);
      setExtracts(p => editing.isNew ? [...p, form] : p.map(s => s.id === form.id ? form : s));
    } else {
      // The strain row has to exist before strain_weights can reference it.
      const { error } = await supabase.from('strains').upsert(strainToDb(form));
      if (error) return reportWrite(error);
      const wErr = await saveWeights(form.id, form.weights ?? {});
      if (wErr) return reportWrite(wErr);
      setStrains(p => editing.isNew ? [...p, form] : p.map(s => s.id === form.id ? form : s));
    }
    setSaveError(null);
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

  // Print pages come from weight_options.print_page, so the tab list and the
  // page contents stay in sync with the table without a code change.
  const printPages = [...new Map(
    weightOptions.map(w => [w.print_page, w])
  ).values()];

  const doPrint = async (pageId, pageTitle) => {
    let html;
    if (pageId === 'extracts') {
      html = buildExtractsHtml(extracts);
    } else {
      const { data, error } = await supabase.from('v_print_menu').select('*');
      if (error) return reportWrite(error);
      const rows = data ?? [];

      const skipped = rows.filter(r =>
        r.print_page === pageId && r.in_stock !== false && r.price == null);
      if (skipped.length && !window.confirm(
        `${skipped.length} in-stock listing${skipped.length === 1 ? '' : 's'} on this page ` +
        `${skipped.length === 1 ? 'has' : 'have'} no price and will be left off:\n\n` +
        `${[...new Set(skipped.map(r => `${r.name} — ${r.weight_label}`))].join('\n')}\n\nPrint anyway?`
      )) return;

      html = buildFlowerHtml(rows, pageId, pageTitle);
    }
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

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>{lbl('Brand')}{sel('brandId', brands.map(b => [b.id, b.label]))}</div>
                <div>{lbl('THC %')}{inp('thc')}</div>
                <div>{lbl('CBD %')}{inp('cbd')}</div>
              </div>

              {/* One row per offered weight. Checking a weight creates a
                  strain_weights row on save, unchecking deletes it. Price is
                  per weight — there is no single strain price any more. */}
              <div style={{ marginBottom: '14px', background: '#252540', padding: '12px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                {lbl('Weights offered — each has its own price')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {weightOptions.map(w => {
                    const on = form.weights?.[w.weight] !== undefined;
                    return (
                      <div key={w.weight} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '10px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: on ? C.text : C.muted, fontSize: '13px', cursor: 'pointer', minHeight: TAP }}>
                          <input
                            type="checkbox" checked={on}
                            onChange={e => setForm(p => {
                              const next = { ...(p.weights ?? {}) };
                              if (e.target.checked) next[w.weight] = '';
                              else delete next[w.weight];
                              return { ...p, weights: next };
                            })}
                            style={{ width: 20, height: 20, accentColor: C.accent, cursor: 'pointer' }}
                          />
                          {w.label} <span style={{ color: C.muted, fontSize: 11 }}>({w.weight})</span>
                        </label>
                        <input
                          type="number" inputMode="decimal" step="0.01" min="0"
                          disabled={!on}
                          placeholder={on ? 'price' : '—'}
                          value={form.weights?.[w.weight] ?? ''}
                          onChange={e => setForm(p => ({ ...p, weights: { ...p.weights, [w.weight]: e.target.value } }))}
                          style={{
                            width: '100%', minHeight: TAP, background: on ? '#14142a' : '#1a1a2a',
                            border: `1px solid ${C.border}`, color: on ? C.text : C.muted,
                            padding: '6px 8px', borderRadius: '3px', fontSize: '16px', textAlign: 'center',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
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
          <li><strong>Stock dot:</strong> The circle on the left of each row. Filled green means in stock, hollow means out. Everyone can tap it — out-of-stock strains stay in the list but don't print.</li>
          <li><strong>Weights and prices:</strong> Every weight a strain is offered in has its own price. Open ✎ Edit to tick the weights and type a price for each.</li>
          <li><strong>✎ Edit:</strong> Brand, THC %, lineage, terpenes, and per-weight prices. Editors only.</li>
          <li><strong>Bands:</strong> Strains group A–H, I–N, O–U, V–Z. Tap a band header to fold it.</li>
          <li><strong>Printing:</strong> Which page a weight prints on is set in the database, not here. Quarters currently print under the eighths page.</li>
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
          <div style={{ fontSize: '11px', color: C.muted }}>
            Menu Manager v2 · {user?.email} · {isMenuEditor ? 'editor' : 'view + stock only'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isMenuEditor && (
            <button
              onClick={importBackup}
              style={{ background: C.panel, color: C.text, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              📂 Import JSON
            </button>
          )}
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
          <button
            onClick={signOut}
            style={{ background: C.panel, color: C.muted, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Sign out
          </button>
        </div>
      </div>

      {loadError && (
        <div style={{ background: '#3a1f1f', color: '#e79090', padding: '10px 18px', fontSize: 13 }}>
          {loadError}
        </div>
      )}

      {/* The UI gate is cosmetic; this is where the database's answer shows up. */}
      {saveError && (
        <div style={{ background: '#3a1f1f', color: '#e79090', padding: '10px 18px', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', color: '#e79090', cursor: 'pointer', fontSize: 15 }}>×</button>
        </div>
      )}
      {/* 3. Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#12122a', overflowX: 'auto' }}>
        {/* Print tabs are generated from weight_options.print_page, so adding
            a weight that prints on a new page adds a tab by itself. */}
        {[
          ['edit-flower', 'Edit Flower'],
          ['edit-extracts', 'Edit Extracts'],
          ...printPages.map(p => [p.print_page, `Print ${p.print_page[0].toUpperCase()}${p.print_page.slice(1)}`]),
          ['extracts', 'Print Extracts'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 18px', border: 'none', background: 'transparent', color: tab === id ? '#fff' : C.muted, borderBottom: tab === id ? `2px solid ${C.accent}` : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: tab === id ? 'bold' : 'normal', whiteSpace: 'nowrap' }}>{lbl}</button>
        ))}
      </div>

    <div style={{ padding: '18px', maxWidth: (tab === 'edit-flower' || tab === 'edit-extracts') ? '1400px' : '920px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
       {tab === 'edit-flower' && (
          <div>
            {isMenuEditor && (
              <button onClick={openNewFlower} style={{ background: C.accent, color: '#fff', border: 'none', padding: '10px 18px', minHeight: TAP, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '18px' }}>+ Add Flower Strain</button>
            )}

            {loaded && !strains.length && (
              <div style={{ color: C.muted, fontSize: 13, padding: '30px 0', textAlign: 'center' }}>
                No strains. Either nothing is in the database, or your login cannot read it.
              </div>
            )}

            {/* Alphabet bands. The old tier grouping is gone with the tiers. */}
            {BANDS.map(band => {
              const bandStrains = strains
                .filter(s => bandOf(s.name) === band.id)
                .sort((a, b) => a.name.localeCompare(b.name));
              if (!bandStrains.length) return null;
              const isOpen = !collapsed[band.id];

              return (
                <div key={band.id} style={{ marginBottom: '16px', background: C.panel, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  <button
                    onClick={() => toggleBand(band.id)}
                    style={{ width: '100%', minHeight: TAP, background: '#2a2a45', color: '#fff', fontWeight: 'bold', padding: '10px 16px', fontSize: '14px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', cursor: 'pointer' }}
                  >
                    <span>{isOpen ? '▾' : '▸'} {band.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.7 }}>
                      {bandStrains.length} strain{bandStrains.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {isOpen && bandStrains.map((s, i) => {
                    const offered = weightOptions.filter(w => s.weights[w.weight] !== undefined);
                    const out = s.inStock === false;
                    return (
                      <div key={s.id} style={{
                        // Every flexible track gets an explicit floor via
                        // minmax(). A bare `1fr` can't shrink below its
                        // content's min-content width, which is what made the
                        // price cells spill into the column next door.
                        display: 'grid',
                        gridTemplateColumns: '28px 22px minmax(120px, 1.6fr) 90px 78px minmax(190px, 1.5fr) 72px',
                        gap: '10px',
                        padding: '10px 12px', alignItems: 'center', minHeight: TAP,
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        opacity: out ? 0.45 : 1,
                        borderBottom: `1px solid ${C.border}44`,
                      }}>
                        {/* Stock dot — the one control every login gets */}
                        <button
                          onClick={() => toggleStock(s.id, false)}
                          title={out ? 'Mark in stock' : 'Mark out of stock'}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${out ? '#4a4a6a' : C.good}`, background: out ? 'transparent' : C.good, cursor: 'pointer', padding: 0 }}
                        />

                        <div style={{ color: TU[s.type], fontWeight: 'bold', fontSize: '15px', textAlign: 'center' }}>{s.type}</div>

                        <div title={s.name} style={{ minWidth: 0, fontWeight: 'bold', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: out ? 'line-through' : 'none' }}>
                          {s.name}
                        </div>

                        <div style={{ minWidth: 0, fontSize: '11px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {brands.find(b => b.id === s.brandId)?.label ?? <span style={{ color: '#a06060' }}>no brand</span>}
                        </div>

                        {isMenuEditor
                          ? <InlineCell
                              value={s.thc} suffix="%" width={48}
                              onCommit={v => saveStrainField(s.id, 'thc', v)}
                            />
                          : <div style={{ fontSize: '12px', textAlign: 'center', color: s.thc === '' ? C.muted : C.text }}>
                              {s.thc === '' ? '—' : `${s.thc}%`}
                            </div>}

                        {/* Which weights a strain is offered in comes from the
                            modal; the price for each is editable in place so
                            bulk entry doesn't mean 38 modal round trips. */}
                        <div style={{ minWidth: 0, display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {offered.length === 0
                            ? <span style={{ fontSize: 11, color: '#a06060' }}>no weights set</span>
                            : offered.map(w => (
                                <span key={w.weight} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, background: '#14142a', border: `1px solid ${C.border}`, borderRadius: 3, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                                  {w.label}
                                  {isMenuEditor
                                    ? <InlineCell
                                        value={s.weights[w.weight]} prefix="$" width={52}
                                        onCommit={v => saveWeightPrice(s.id, w.weight, v)}
                                      />
                                    : <strong style={{ color: '#fff' }}>{money(s.weights[w.weight]) || '—'}</strong>}
                                </span>
                              ))}
                        </div>

                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          {isMenuEditor && (
                            <>
                              <button onClick={() => openEdit(s, false)} title="Edit details and prices"
                                style={{ background: '#35355a', color: C.text, border: 'none', padding: '8px 10px', minHeight: 36, borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>✎</button>
                              <button onClick={() => deleteItem(s.id, false)} title="Delete strain"
                                style={{ background: '#3a1f1f', color: '#e07070', border: 'none', padding: '8px 10px', minHeight: 36, borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

                
        {tab === 'edit-extracts' && (
          <div>
            {isMenuEditor && (
              <button onClick={openNewExtract} style={{ background: C.accent, color: '#fff', border: 'none', padding: '10px 18px', minHeight: TAP, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '18px' }}>+ Add Vape / Concentrate</button>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {/* Columns: Disposables, Cartridges, Concentrates */}
              {[
                { id: 'disposable', label: 'DISPOSABLES', items: sortItems(extracts.filter(e => e.category === 'vape' && e.hasBattery)) },
                { id: 'cartridge', label: 'CARTRIDGES', items: sortItems(extracts.filter(e => e.category === 'vape' && !e.hasBattery)) },
                { id: 'concentrate', label: 'CONCENTRATES', items: sortItems(extracts.filter(e => e.category === 'concentrate')) }
              ].map(col => (
                <div key={col.id}>
                  <div style={{ background: '#35355a', color: '#fff', fontWeight: 'bold', padding: '10px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', fontSize: '14px', letterSpacing: '1px' }}>
                    {col.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {col.items.map(s => (
                       <div key={s.id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: '6px', opacity: s.inStock === false ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                               <span style={{ color: TU[s.type], fontWeight: 'bold', marginRight: '6px' }}>{s.type}</span>
                               <strong style={{ color: '#fff', textDecoration: s.inStock === false ? 'line-through' : 'none' }}>{s.brand}</strong>
                               <div style={{ color: C.text, fontSize: '13px', marginTop: '2px', textDecoration: s.inStock === false ? 'line-through' : 'none' }}>{s.name}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold', color: C.text }}>{s.price}</div>
                              <div style={{ fontSize: '11px', color: C.muted }}>{s.size}</div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: C.muted, fontSize: '11px' }}>{s.extract}{s.category === 'concentrate' && s.texture ? ` ${s.texture}` : ''}</span>
                            
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => toggleStock(s.id, true)} style={{ background: s.inStock === false ? '#4a4a6a' : '#2d5a2d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>{s.inStock === false ? 'Out' : 'In'}</button>
                              {isMenuEditor && (
                                <>
                                  <button onClick={() => openEdit(s, true)} style={{ background: '#35355a', color: C.text, border: 'none', padding: '6px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                                  <button onClick={() => deleteItem(s.id, true)} style={{ background: '#3a1f1f', color: '#e07070', border: 'none', padding: '6px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>×</button>
                                </>
                              )}
                            </div>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {(tab === 'extracts' || printPages.some(p => p.print_page === tab)) && (() => {
          const title = tab === 'extracts'
            ? 'EXTRACTS & VAPES'
            : `FLOWER — ${tab.toUpperCase()}`;
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', background: C.panel, padding: '10px 16px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '12px', color: C.good }}>✓ Ready to print — {title}</div>
              <button onClick={() => doPrint(tab, title)} style={{ background: C.accent, color: '#fff', border: 'none', padding: '10px 22px', minHeight: TAP, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Open Print View</button>
            </div>
          );
        })()}
      </div>

      {/* This renders the edit popup if it's active */}
      {editing && EditModal()}
      
    </div>
  );
}

