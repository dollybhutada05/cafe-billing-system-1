/**
 * Urban Brew Cafe – Billing System
 * Handles menu rendering, cart management, and printing
 */

// ===== MENU DATA =====
const MENU = [
  { id: 1, name: 'Espresso', price: 120, category: 'drinks' },
  { id: 2, name: 'Cappuccino', price: 160, category: 'drinks' },
  { id: 3, name: 'Iced Latte', price: 180, category: 'drinks' },
  { id: 4, name: 'Cold Brew', price: 190, category: 'drinks' },
  { id: 5, name: 'Cheese Croissant', price: 140, category: 'food' },
  { id: 6, name: 'Paneer Sandwich', price: 150, category: 'food' },
  { id: 7, name: 'Chocolate Muffin', price: 110, category: 'food' },
  { id: 8, name: 'French Fries', price: 130, category: 'food' }
];

// ===== STATE =====
let cart = [];
const TAX_RATE = 0.05;

// ===== DOM REFS =====
const drinksGrid = document.getElementById('drinks-grid');
const foodGrid = document.getElementById('food-grid');
const cartContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const printBtn = document.getElementById('print-receipt-btn');
const statusEl = document.getElementById('header-status');
const pulseIndicator = document.getElementById('pulse-indicator');

// ===== RENDER MENU =====
function renderMenu() {
  drinksGrid.innerHTML = '';
  foodGrid.innerHTML = '';

  MENU.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <div class="item-name">${item.name}</div>
      <div class="item-price">₹${item.price.toFixed(2)}</div>
      <button class="btn-add" data-id="${item.id}">Add</button>
    `;
    card.querySelector('.btn-add').addEventListener('click', () => addToCart(item.id));
    if (item.category === 'drinks') {
      drinksGrid.appendChild(card);
    } else {
      foodGrid.appendChild(card);
    }
  });
}

// ===== CART OPERATIONS =====
function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    const menuItem = MENU.find(item => item.id === id);
    cart.push({ ...menuItem, qty: 1 });
  }
  updateCart();
  setStatus('Item added', true);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== id);
    }
    updateCart();
  }
}

function clearCart() {
  cart = [];
  updateCart();
}

function getSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getTax(subtotal) {
  return subtotal * TAX_RATE;
}

function getTotal(subtotal) {
  return subtotal + getTax(subtotal);
}

// ===== UPDATE UI =====
function updateCart() {
  // Render cart items
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p class="empty-cart-msg">No items added yet.</p>';
  } else {
    cartContainer.innerHTML = '';
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <small>₹${item.price} x ${item.qty}</small>
        </div>
        <div class="qty-controls">
          <button data-id="${item.id}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button data-id="${item.id}" data-delta="1">+</button>
        </div>
      `;
      row.querySelectorAll('.qty-controls button').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          const delta = parseInt(btn.dataset.delta);
          changeQty(id, delta);
        });
      });
      cartContainer.appendChild(row);
    });
  }

  // Update summary
  const subtotal = getSubtotal();
  const tax = getTax(subtotal);
  const total = getTotal(subtotal);

  subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  taxEl.textContent = `₹${tax.toFixed(2)}`;
  totalEl.textContent = `₹${total.toFixed(2)}`;

  // Enable/disable print button
  printBtn.disabled = cart.length === 0;
}

// ===== STATUS =====
function setStatus(text, isReady) {
  statusEl.textContent = 'Status: ' + text;
  statusEl.style.color = isReady ? '#34d399' : '#f59e0b';
  if (text === 'Printing...') {
    pulseIndicator.classList.add('printing');
  } else {
    pulseIndicator.classList.remove('printing');
  }
}

// ===== PRINT RECEIPT =====
function printReceipt() {
  if (cart.length === 0) {
    alert('Please add items to the order first!');
    return;
  }

  setStatus('Printing...', false);
  printBtn.disabled = true;

  // Save cart to localStorage
  localStorage.setItem('cafeCart', JSON.stringify(cart));

  // Open printer page in new tab
  const printerWindow = window.open('printer.html', '_blank');

  // If popup is blocked, fallback
  if (!printerWindow || printerWindow.closed) {
    alert('Please allow popups to view the printer page.');
    setStatus('Ready', true);
    printBtn.disabled = false;
    return;
  }

  // Reset status after a moment (printer page will handle printing)
  setTimeout(() => {
    setStatus('Ready', true);
    printBtn.disabled = false;
  }, 1000);
}

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
    const tag = document.activeElement?.tagName || '';
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault();
      if (!printBtn.disabled) printBtn.click();
    }
  }
});

// ===== INIT =====
printBtn.addEventListener('click', printReceipt);
renderMenu();
updateCart();
setStatus('Ready', true);