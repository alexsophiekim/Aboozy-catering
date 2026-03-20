const menu = document.getElementById("menu");
const addons = document.querySelectorAll(".addon");
const totalEl = document.getElementById("total");
const accountNumber = "06-0730-0465387-00"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMpdVe2ChF8ZOsVNmosNKkHGAi4dXY33mE1llET_8eeYDN3g2Gd2iBrKl88qcE3xk/exec";

document.getElementById("accountNumber").innerText = accountNumber;

function calculate() {
  let total = parseInt(menu.value);

  addons.forEach(a => {
    if (a.checked) total += parseInt(a.value);
  });

  totalEl.innerText = "Total: $" + total;
  return total;
}

function generateOrderId() {
  return "ORD" + Date.now();
}

// Event
menu.addEventListener("change", calculate);
addons.forEach(a => a.addEventListener("change", calculate));

// Submit
document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Add-ons 
  const selectedAddons = [];
  document.querySelectorAll(".addon:checked").forEach(a => {
    selectedAddons.push(a.parentNode.textContent.trim());
  });
  data.addons = selectedAddons.join(", ");

  // OrderID
  const orderId = "ORD" + Date.now();
  data.orderId = orderId;

  const total = calculate();
  data.total = total;

  await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  // screen
  document.getElementById("orderForm").style.display = "none";
  document.getElementById("result").style.display = "block";
  document.getElementById("finalAmount").innerText = "Total: $" + total;
  document.getElementById("reference").innerText = orderId;
});
