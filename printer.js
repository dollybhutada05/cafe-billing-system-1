/**
 * Thermal Printer Simulation – Standalone Page
 * Reads cart data from localStorage and prints a receipt
 */

// ===== DOM REFS =====
const receipt = document.getElementById('thermal-receipt');
const tearOverlay = document.getElementById('tear-prompt-overlay');
const printer = document.getElementById('thermal-printer');
const ledPower = document.getElementById('led-power');
const ledPaper = document.getElementById('led-paper');
const ledError = document.getElementById('led-error');
const scanline = document.getElementById('thermal-scanline');
const closeBtn = document.getElementById('close-printer-btn');

// ===== STATE =====
let isPrinting = false;
let isComplete = false;

// ===== LED CONTROL =====
function setLEDs(state) {
  ledPower.classList.remove('printing', 'active');
  ledPaper.classList.remove('active');
  ledError.classList.remove('active');

  switch (state) {
    case 'idle':
      ledPower.classList.add('active');
      break;
    case 'printing':
      ledPower.classList.add('printing');
      ledPaper.classList.add('active');
      break;
    case 'done':
      ledPower.classList.add('active');
      break;
    case 'error':
      ledError.classList.add('active');
      break;
  }
}

// ===== RECEIPT CONTROLS =====
function resetReceipt() {
  receipt.classList.remove('is-emerging', 'is-complete', 'torn-away');
  receipt.style.maxHeight = '0';
  receipt.style.opacity = '0';
  receipt.style.transform = 'translateY(10px) scale(0.98)';
  tearOverlay.style.opacity = '0';
}

function populateReceipt(cart) {
  const itemsList = document.getElementById('receipt-items-list');
  itemsList.innerHTML = '';

  if (!cart || cart.length === 0) {
    itemsList.innerHTML = '<p style="text-align:center; color:#999; padding:1rem 0;">No items to display.</p>';
    return;
  }

  cart.forEach(item => {
    const line = document.createElement('div');
    line.className = 'receipt-line-item';
    line.innerHTML = `
      <span class="col-qty">${item.qty}x</span>
      <div class="item-details">
        <span class="item-name">${item.name}</span>
      </div>
      <span class="col-price">₹${(item.price * item.qty).toFixed(2)}</span>
    `;
    itemsList.appendChild(line);
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  document.getElementById('receipt-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('receipt-tax').textContent = `₹${tax.toFixed(2)}`;
  document.getElementById('receipt-total').textContent = `₹${total.toFixed(2)}`;

  // Update date/time
  const now = new Date();
  document.getElementById('receipt-date').textContent = now.toISOString().split('T')[0];
  document.getElementById('receipt-time').textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('receipt-invoice').textContent = String(Math.floor(Math.random() * 9000 + 1000));
}

// ===== PRINT SEQUENCE =====
function printReceipt(cart) {
  if (isPrinting) return;
  if (!cart || cart.length === 0) {
    document.getElementById('receipt-items-list').innerHTML =
      '<p style="text-align:center; color:#999; padding:1rem 0;">No order data found.</p>';
    return;
  }

  resetReceipt();
  populateReceipt(cart);

  isPrinting = true;
  isComplete = false;
  setLEDs('printing');
  printer.classList.add('is-vibrating');
  scanline.classList.add('active');

  // Step 1: Receipt emerges
  setTimeout(() => {
    receipt.classList.add('is-emerging');
  }, 280);

  // Step 2: Print complete
  setTimeout(() => {
    printer.classList.remove('is-vibrating');
    scanline.classList.remove('active');
    setLEDs('done');

    receipt.classList.remove('is-emerging');
    receipt.classList.add('is-complete');
    receipt.style.maxHeight = '900px';
    receipt.style.opacity = '1';
    receipt.style.transform = 'translateY(0) scale(1)';

    tearOverlay.style.opacity = '1';
    isComplete = true;
    isPrinting = false;
  }, 1600);
}

// ===== TEAR OFF =====
function tearReceipt() {
  if (!isComplete) return;
  if (receipt.classList.contains('torn-away')) return;

  receipt.classList.add('torn-away');
  tearOverlay.style.opacity = '0';
  isComplete = false;

  setTimeout(() => {
    receipt.classList.remove('is-complete', 'torn-away');
    receipt.style.maxHeight = '0';
    receipt.style.opacity = '0';
    receipt.style.transform = 'translateY(10px) scale(0.98)';
  }, 850);
}

// ===== LOAD DATA & PRINT =====
function loadAndPrint() {
  const cartData = localStorage.getItem('cafeCart');

  if (cartData) {
    try {
      const cart = JSON.parse(cartData);
      printReceipt(cart);
      // Clear storage after printing so it doesn't re-print on refresh
      // localStorage.removeItem('cafeCart');
    } catch (e) {
      console.error('Invalid cart data:', e);
      document.getElementById('receipt-items-list').innerHTML =
        '<p style="text-align:center; color:#999; padding:1rem 0;">Error loading order data.</p>';
    }
  } else {
    document.getElementById('receipt-items-list').innerHTML =
      '<p style="text-align:center; color:#999; padding:1rem 0;">No order found. Please add items from the billing page.</p>';
  }
}

// ===== EVENT LISTENERS =====
receipt.addEventListener('click', tearReceipt);

const tearPill = document.querySelector('.tear-pill');
if (tearPill) {
  tearPill.addEventListener('click', (e) => {
    e.stopPropagation();
    tearReceipt();
  });
}

closeBtn.addEventListener('click', () => window.close());

// ===== INIT =====
setLEDs('idle');
loadAndPrint();

// If the user refreshes the page, we don't want to re-print automatically,
// but we keep the receipt visible. On refresh, we check if there's data.
// Also handle case where page is opened directly without data.