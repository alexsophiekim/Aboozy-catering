const MENUS = [
  { id: 'setA', name: 'Set A', price: 60,  desc: 'Medium boneless crispy chicken · Wedges · Slaw' },
  { id: 'setB', name: 'Set B', price: 100, desc: 'Extra Large boneless crispy chicken · Wedges · 2 Slaw — Party Pack' }
];
const SAUCES = ['Plain', 'Soy Garlic', 'Sweet & Spicy', 'Volcano'];
const ADDONS = [
  { id: 'wedges', name: 'Wedges',           price: 12 },
  { id: 'salad',  name: 'Extra Salad',      price: 5  },
  { id: 'sauce',  name: 'Extra Sauce',      price: 2  },
  { id: 'drink',  name: 'Soft Drink (330ml)', price: 3 }
];

let menuQty  = {};
let addonSel = {};
let selSauce = null;
let selTime  = null;
let blockMode = false;
let blocked  = new Set();

MENUS.forEach(m => menuQty[m.id]  = 0);
ADDONS.forEach(a => addonSel[a.id] = 0);

/* ── Times ── */
function buildTimes() {
  const t = [];
  for (let h = 10; h <= 20; h++) {
    t.push(String(h).padStart(2,'0') + ':00');
    if (h < 20) t.push(String(h).padStart(2,'0') + ':30');
  }
  return t;
}
const allTimes = buildTimes();

function renderTimes() {
  const g = document.getElementById('timeGrid');
  g.innerHTML = '';
  allTimes.forEach(t => {
    const b = document.createElement('button');
    b.className = 't-btn' + (blocked.has(t) ? ' blocked' : selTime === t ? ' sel' : '');
    b.textContent = t;
    b.onclick = () => {
      if (blockMode) {
        blocked.has(t) ? blocked.delete(t) : blocked.add(t);
        if (selTime === t) selTime = null;
      } else if (!blocked.has(t)) {
        selTime = t;
      }
      renderTimes();
    };
    g.appendChild(b);
  });
}

function toggleBlock() {
  blockMode = !blockMode;
  const b = document.getElementById('blkBtn');
  b.className = 'blk-toggle' + (blockMode ? ' on' : '');
  b.textContent = blockMode ? 'Done blocking' : 'Block times';
  document.getElementById('blockHint').style.display = blockMode ? 'block' : 'none';
}

/* ── Menus ── */
function renderMenus() {
  const c = document.getElementById('menuContainer');
  c.innerHTML = '';
  MENUS.forEach(m => {
    const sel = menuQty[m.id] > 0;
    const card = document.createElement('div');
    card.className = 'menu-card' + (sel ? ' selected' : '');
    card.innerHTML = `
      <div class="mc-row">
        <div class="mc-left">
          <div class="mc-name">${m.name}</div>
          <div class="mc-desc">${m.desc}</div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px">
          <span class="mc-price">$${m.price}</span>
          <div class="mc-check"><div class="mc-dot"></div></div>
        </div>
      </div>
      ${sel ? `
        <div class="qty-row">
          <button class="qty-ctrl" onclick="event.stopPropagation();chgMenu('${m.id}',-1)">−</button>
          <span class="qty-num">${menuQty[m.id]}</span>
          <button class="qty-ctrl" onclick="event.stopPropagation();chgMenu('${m.id}',1)">+</button>
          <span class="qty-sub">= $${menuQty[m.id] * m.price}</span>
        </div>` : ''}
    `;
    card.onclick = () => {
      menuQty[m.id] = menuQty[m.id] === 0 ? 1 : 0;
      renderMenus();
      calcTotal();
    };
    c.appendChild(card);
  });
}

function chgMenu(id, d) {
  menuQty[id] = Math.max(0, menuQty[id] + d);
  renderMenus();
  calcTotal();
}

function addCustomMenu() {
  const name  = prompt('Menu name?');       if (!name)        return;
  const ps    = prompt('Price ($)?');       if (!ps)          return;
  const price = parseFloat(ps);            if (isNaN(price)) return;
  const desc  = prompt('Description (optional)') || '';
  const id    = 'c_' + Date.now();
  MENUS.push({ id, name, price, desc });
  menuQty[id] = 0;
  renderMenus();
  calcTotal();
}

/* ── Sauces ── */
function renderSauces() {
  const g = document.getElementById('sauceGrid');
  g.innerHTML = '';
  SAUCES.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'sauce-btn' + (selSauce === i ? ' selected' : '');
    b.textContent =  s;
    b.onclick = () => { selSauce = selSauce === i ? null : i; renderSauces(); };
    g.appendChild(b);
  });
}

/* ── Add-ons ── */
function renderAddons() {
  const g = document.getElementById('addonGroup');
  g.innerHTML = '';
  ADDONS.forEach(a => {
    const b = document.createElement('button');
    b.className = 'addon-btn' + (addonSel[a.id] ? ' selected' : '');
    b.innerHTML = `<span class="addon-name">${a.name}</span><span class="addon-price">+$${a.price}</span>`;
    b.onclick = () => { addonSel[a.id] = addonSel[a.id] ? 0 : 1; renderAddons(); calcTotal(); };
    g.appendChild(b);
  });
}

/* ── Total ── */
function calcTotal() {
  let t = 0;
  MENUS.forEach(m  => t += menuQty[m.id]   * m.price);
  ADDONS.forEach(a => t += addonSel[a.id]  * a.price);
  document.getElementById('total').textContent = '$' + t;
  return t;
}

/* ── Submit ── */
function placeOrder() {
  const name  = document.getElementById('fname').value.trim();
  const email = document.getElementById('femail').value.trim();
  const phone = document.getElementById('fphone').value.trim();
  const date  = document.getElementById('fdate').value;

  if (!name || !email || !phone) { alert('Please fill in name, email, and phone.'); return; }
  if (!date)    { alert('Please select a pickup date.'); return; }
  if (!selTime) { alert('Please select a pickup time.'); return; }
  if (!MENUS.some(m => menuQty[m.id] > 0)) { alert('Please select at least one menu item.'); return; }

  const total   = calcTotal();
  const orderId = 'ORD' + Math.floor(1000 + Math.random() * 9000);
  const items   = MENUS.filter(m => menuQty[m.id] > 0).map(m => m.name + ' ×' + menuQty[m.id]).join(', ');
  const addons  = ADDONS.filter(a => addonSel[a.id]).map(a => a.name).join(', ') || '—';
  const sauce   = selSauce !== null ? SAUCES[selSauce] : '—';

  document.getElementById('os-order').textContent  = items;
  document.getElementById('os-sauce').textContent  = sauce;
  document.getElementById('os-addons').textContent = addons;
  document.getElementById('os-pickup').textContent = date + ' at ' + selTime;
  document.getElementById('os-ref').textContent    = orderId;
  document.getElementById('os-total').textContent  = '$' + total;
  document.getElementById('overlaySub').textContent =
    'Almost done — transfer $' + total + ' now to secure your order. We\'ll confirm once payment clears.';

  document.getElementById('overlay').classList.add('show');
}

function doCopy() {
  navigator.clipboard.writeText('06-0730-0465387-00');
  const b = document.getElementById('copyBtn');
  b.textContent = 'Copied!';
  b.classList.add('copied');
  setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('copied'); }, 1800);
}

function resetForm() {
  MENUS.forEach(m  => menuQty[m.id]  = 0);
  ADDONS.forEach(a => addonSel[a.id] = 0);
  selSauce = null; selTime = null; blockMode = false; blocked = new Set();
  ['fname','femail','fphone','fnotes','fmemo','fdate'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('overlay').classList.remove('show');
  renderMenus(); renderSauces(); renderAddons(); renderTimes(); calcTotal();
  window.scrollTo(0, 0);
}

/* ── Init ── */
const td = new Date();
td.setDate(td.getDate() + 4);
document.getElementById('fdate').min = td.toISOString().split('T')[0];

renderTimes();
renderMenus();
renderSauces();
renderAddons();
calcTotal();