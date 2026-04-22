const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxUhbjwMZ1niuYhle7misbyJZxwb4o1goRxgmzJokyuBTIA7Zw4DQgX9TS8sdV6x-IM/exec";

const MENUS = [
  { id: 'setA', name: 'Set A', price: 60,  desc: '15pcs boneless crispy chicken thigh · Wedges · Slaw' },
  { id: 'setB', name: 'Set B', price: 100, desc: '35pcs boneless crispy chicken thigh · Wedges · 2 Slaw — Party Pack' }
];
const SAUCES = ['Plain', 'Soy Garlic', 'Sweet & Spicy', 'Volcano'];
const ADDONS = [
  { id: 'wedges', name: 'Wedges',             price: 12 },
  { id: 'salad',  name: 'Extra Salad',        price: 5  },
  { id: 'sauce',  name: 'Extra Sauce',        price: 2  },
  { id: 'drink',  name: 'Soft Drink (330ml)', price: 3  }
];
// blocked times
const BLOCKED_TIMES = {
  "2026-05-01": ["16:00", "16:30"],
  "2026-05-07": ["16:00", "16:30", "17:00"],
  // continue adding blocked times here
};
const MAX_PER_SLOT = 3;
let slotCounts = {};

let menuQty   = {};
let addonSel  = {};
let selSauces = [];      // ← array, up to 2
let selMethod = null;

MENUS.forEach(m  => menuQty[m.id]  = 0);
ADDONS.forEach(a => addonSel[a.id] = 0);

/* ── Time dropdown 16:00–21:00, 30 min ── */
function buildTimeOptions() {
  const sel = document.getElementById('ftime');
  for (let h = 16; h <= 21; h++) {
    ['00', '30'].forEach(m => {
      if (h === 21 && m === '30') return;
      const val = `${String(h).padStart(2,'0')}:${m}`;
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      sel.appendChild(opt);
    });
  }
  sel.addEventListener('change', checkSlot);
}

function slotKey() {
  const date = document.getElementById('fdate').value;
  const time = document.getElementById('ftime').value;
  return date && time ? `${date}_${time}` : null;
}

function checkSlot() {
  const date = document.getElementById('fdate').value;
  const time = document.getElementById('ftime').value;
  const sel  = document.getElementById('ftime');
  const warn = document.getElementById('slotWarning');

  // 시간 옵션 업데이트 (블락된 시간 비활성화)
  Array.from(sel.options).forEach(opt => {
    const blocked = BLOCKED_TIMES[date] || [];
    opt.disabled = blocked.includes(opt.value);
    // 블락된 옵션이 현재 선택되어 있으면 해제
    if (opt.disabled && opt.selected) {
      sel.value = "";
    }
  });

  // 슬롯 풀 체크
  const key   = slotKey();
  if (!key) return;
  const count = slotCounts[key] || 0;
  if (count >= MAX_PER_SLOT) {
    warn.style.display = 'block';
    document.getElementById('orderSubmit').disabled = true;
  } else {
    warn.style.display = 'none';
    document.getElementById('orderSubmit').disabled = false;
  }
}

/* ── flatpickr ── */
flatpickr('#fdate', {
  minDate: new Date().fp_incr(4),
  disable: [
    "2026-03-28",
    "2026-05-26",
    // Block date range
    // { from: "2026-04-01", to: "2026-04-07" }
  ],
  dateFormat: 'Y-m-d',
  disableMobile: false,
  onChange: checkSlot
});

/* ── Payment method ── */
document.getElementById('payMethodGroup').addEventListener('click', e => {
  const btn = e.target.closest('.pay-method-btn');
  if (!btn) return;
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selMethod = btn.dataset.method;

  document.getElementById('transferInfo').style.display   = selMethod === 'transfer' ? 'block' : 'none';
  document.getElementById('ondeliveryInfo').style.display = (selMethod === 'cash' || selMethod === 'debit') ? 'block' : 'none';

  const msg = selMethod === 'cash'
    ? '💵 Cash on delivery. Please have cash ready.'
    : '💳 You will pay by debit card on delivery. EFTPOS only.';
  document.getElementById('ondeliveryText').textContent = msg;
});

function copyInline(btn) {
  navigator.clipboard.writeText('06-0730-0465387-00');
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 1800);
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

/* ── Sauces — up to 2 ── */
function renderSauces() {
  const g = document.getElementById('sauceGrid');
  g.innerHTML = '';
  SAUCES.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'sauce-btn' + (selSauces.includes(i) ? ' selected' : '');
    b.textContent = s;
    b.onclick = () => {
      if (selSauces.includes(i)) {
        selSauces = selSauces.filter(x => x !== i);
      } else {
        if (selSauces.length >= 2) {
          alert('You can select up to 2 sauces only.');
          return;
        }
        selSauces.push(i);
      }
      renderSauces();
    };
    g.appendChild(b);
  });
}

/* ── Add-ons ── */
function renderAddons() {
  const g = document.getElementById('addonGroup');
  g.innerHTML = '';
  ADDONS.forEach(a => {
    const qty = addonSel[a.id] || 0;
    const b = document.createElement('div');
    b.className = 'addon-btn' + (qty > 0 ? ' selected' : '');
    b.innerHTML = `
      <span class="addon-name">${a.name}</span>
      <span class="addon-price">+$${a.price}</span>
      <div class="addon-qty-row">
        <button class="addon-qty-ctrl" onclick="event.stopPropagation();chgAddon('${a.id}',-1)">−</button>
        <span class="addon-qty-num">${qty}</span>
        <button class="addon-qty-ctrl" onclick="event.stopPropagation();chgAddon('${a.id}',1)">+</button>
      </div>
    `;
    b.onclick = () => {
      addonSel[a.id] = addonSel[a.id] ? 0 : 1;
      renderAddons();
      calcTotal();
    };
    g.appendChild(b);
  });
}

function chgAddon(id, d) {
  addonSel[id] = Math.max(0, (addonSel[id] || 0) + d);
  renderAddons();
  calcTotal();
}

/* ── Total ── */
function calcTotal() {
  let t = 0;
  MENUS.forEach(m  => t += menuQty[m.id]  * m.price);
  ADDONS.forEach(a => t += addonSel[a.id] * a.price);
  document.getElementById('total').textContent = '$' + t;
  return t;
}

/* ── Submit ── */
async function placeOrder() {
  const name    = document.getElementById('fname').value.trim();
  const email   = document.getElementById('femail').value.trim();
  const phone   = document.getElementById('fphone').value.trim();
  const address = document.getElementById('faddress').value.trim();
  const date    = document.getElementById('fdate').value;
  const time    = document.getElementById('ftime').value;
  const notes   = document.getElementById('fnotes').value.trim();

  if (!name)    { alert('Please enter your full name.');        return; }
  if (!phone)   { alert('Please enter your phone number.');     return; }
  if (!address) { alert('Please enter your delivery address.'); return; }
  if (!date)    { alert('Please select a delivery date.');      return; }
  if (!time)    { alert('Please select a delivery time.');      return; }
  if (!MENUS.some(m => menuQty[m.id] > 0)) { alert('Please select at least one menu item.'); return; }
  if (!selMethod) { alert('Please select a payment method.');   return; }

  const key = slotKey();
  if ((slotCounts[key] || 0) >= MAX_PER_SLOT) {
    alert('Sorry, this time slot is fully booked. Please choose another time.');
    return;
  }

  const total    = calcTotal();
  const orderId  = 'ORD' + Math.floor(1000 + Math.random() * 9000);
  const items    = MENUS.filter(m => menuQty[m.id] > 0).map(m => m.name + ' ×' + menuQty[m.id]).join(', ');
  const addons   = ADDONS.filter(a => addonSel[a.id]).map(a => a.name).join(', ') || '—';
  const sauce    = selSauces.length > 0 ? selSauces.map(i => SAUCES[i]).join(' + ') : '—';
  const payLabel = selMethod === 'transfer' ? 'Bank Transfer'
                 : selMethod === 'cash'     ? 'Cash on Delivery'
                 :                            'Debit Card on Delivery';

  const btn = document.getElementById('orderSubmit');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  const data = {
    OrderID: orderId,
    Name:    name,
    Phone:   phone,
    Email:   email,
    Address: address,
    Items:   items,
    Sauce:   sauce,
    AddOns:  addons,
    Notes:   notes,
    Date:    date,
    Time:    time,
    Payment: payLabel,
    Total:   total
  };

  try {
    await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
    slotCounts[key] = (slotCounts[key] || 0) + 1;
  } catch (err) {
    console.error('Submit error:', err);
  }

  // Fill overlay
  document.getElementById('os-order').textContent   = items;
  document.getElementById('os-sauce').textContent   = sauce;
  document.getElementById('os-addons').textContent  = addons;
  document.getElementById('os-pickup').textContent  = date + ' at ' + time;
  document.getElementById('os-payment').textContent = payLabel;
  document.getElementById('os-ref').textContent     = orderId;
  document.getElementById('os-total').textContent   = '$' + total;

  if (selMethod === 'transfer') {
    document.getElementById('overlayIcon').textContent  = '⏳';
    document.getElementById('overlayTitle').textContent = 'Almost There!';
    document.getElementById('overlaySub').textContent   = 'Transfer $' + total + ' to BRODIAM LTD to confirm your order. We\'ll be in touch once payment clears.';
    document.getElementById('overlayCta').style.display = 'block';
  } else {
    document.getElementById('overlayIcon').textContent  = '🎉';
    document.getElementById('overlayTitle').textContent = 'Order Placed!';
    const msg = selMethod === 'cash'
      ? 'Please have $' + total + ' cash ready on delivery. See you soon!'
      : 'Please have your debit card ready on delivery. EFTPOS available. See you soon!';
    document.getElementById('overlaySub').textContent   = msg;
    document.getElementById('overlayCta').style.display = 'none';
  }

  document.getElementById('overlay').classList.add('show');
  btn.disabled = false;
  btn.textContent = 'Place Order →';
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
  selSauces = [];
  selMethod = null;
  ['fname','femail','fphone','faddress','fnotes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fdate').value = '';
  document.getElementById('ftime').value = '';
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('transferInfo').style.display   = 'none';
  document.getElementById('ondeliveryInfo').style.display = 'none';
  document.getElementById('slotWarning').style.display    = 'none';
  document.getElementById('overlay').classList.remove('show');
  renderMenus();
  renderSauces();
  renderAddons();
  calcTotal();
  window.scrollTo(0, 0);
}

/* ── Init ── */
buildTimeOptions();
renderMenus();
renderSauces();
renderAddons();
calcTotal();