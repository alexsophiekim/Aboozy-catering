const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxzyehpmBpgmv-F8AJQiKlEasvhZQRKhx9WfIpBGIrIAoEztPR8W8cGU43EAFFGEBs9/exec";
const accountNumber = "06-0730-0465387-00";
// document.getElementById("accountNumber").innerText = accountNumber;

let selectedSet = "";
let selectedQty = 1;

const setButtons = document.querySelectorAll(".set-btn");
const qtyButtons = document.querySelectorAll(".qty-btn");
const addonButtons = document.querySelectorAll(".addon-btn");
const totalEl = document.getElementById("total");

// ===== Acc copy =====
function copyAccount() {
  const acc = document.getElementById("account").innerText;
  navigator.clipboard.writeText(accountNumber);
  alert("Account number copied!");
}

// ===== 세트 선택 =====
setButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedSet = btn.textContent.split(" $")[0];
    calculateTotal();
  });
});

// ===== 수량 선택 =====
qtyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    qtyButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedQty = parseInt(btn.dataset.qty);
    calculateTotal();
  });
});

// ===== Add-on 선택 =====
addonButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
    calculateTotal();
  });
});

function getSelectedAddons() {
  const selected = [];
  addonButtons.forEach(btn => {
    if (btn.classList.contains("selected")) selected.push(btn.textContent);
  });
  return selected;
}

// ===== 총액 계산 =====
function calculateTotal() {
  let total = 0;
  if (selectedSet) {
    const btn = Array.from(setButtons).find(b => b.textContent.startsWith(selectedSet));
    if (btn) total += parseInt(btn.dataset.price) * selectedQty;
  }
  getSelectedAddons().forEach(a => {
    const match = a.match(/\+?\$(\d+)/);
    if (match) total += parseInt(match[1]);
  });
  totalEl.innerText = "Total: $" + total;
  return total;
}

// ===== OrderID ORD0000 =====
function generateOrderId() {
  return "ORD"+Math.floor(1000 + Math.random() * 9000).toString();
}

// ===== submit =====
document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // ===== Loading =====
  const submitBtn = document.getElementById("orderSubmit");
  submitBtn.disabled = true;
  submitBtn.innerText = "Placing Order...";

  const name = document.querySelector("input[name='name']").value;
  const email = document.querySelector("input[name='email']").value;
  const phone = document.querySelector("input[name='phone']").value;
  const address = document.querySelector("input[name='address']").value;
  const note = document.querySelector("textarea[name='note']").value || "";
  const date = document.querySelector("input[name='date']").value || "";
  const time = document.querySelector("select[name='time']").value || "";

  const addons = getSelectedAddons();
  const setItem = `${selectedSet || "No Set"} × ${selectedQty}`; // 세트만

  const total = calculateTotal();
  const orderId = generateOrderId();

  const data = {
    OrderID: orderId,
    Items: setItem,                  // 세트만
    AddOns: addons.join(", "),       // 에드온만
    Total: total,
    name,
    email,
    phone,
    address,
    note,
    date,
    time
  };

  console.log("전송 데이터:", JSON.stringify(data));

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });
    const json = await res.json();
    console.log("Server response:", json);
  } catch (err) {
    console.error("Error sending data:", err);
    // ===== Failure =====
    submitBtn.disabled = false;
    submitBtn.innerText = "Place Order →";
    alert("Something went wrong. Please try again.");
    return;
  }

  document.getElementById("orderForm").style.display = "none";
  const resultDiv = document.getElementById("result");
  resultDiv.style.display = "block";
  document.getElementById("finalAmount").innerText = "Total: $" + total;
  document.getElementById("reference").innerText = orderId;
});

flatpickr("input[name='date']", {
  minDate: new Date().fp_incr(4), // 오늘 + 4일
  disable: [
    { from: "2026-03-28", to: "2026-04-07" }, // 범위 블락
    "2026-04-15",                               // 개별 블락
  ],
  dateFormat: "Y-m-d",
});