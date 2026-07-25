const CART_KEY = 'phpCart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartControls();
  renderCheckout();
  updateCartCount();
}

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function updatePaymentQr(amount) {
  const qr = document.querySelector('[data-payment-qr]');
  if (!qr) return;

  const upiId = (qr.dataset.upiId || '').trim();
  const payableAmount = Number(amount || 0);
  if (payableAmount <= 0 || !upiId) {
    qr.src = qr.dataset.staticSrc || qr.src;
    return;
  }

  const upiParams = new URLSearchParams({
    pa: upiId,
    pn: qr.dataset.payeeName || "Manisha's Kitchen",
    am: payableAmount.toFixed(2),
    cu: 'INR',
  });
  if (qr.dataset.upiAid) {
    upiParams.set('aid', qr.dataset.upiAid);
  }
  const upiUrl = `upi://pay?${upiParams.toString()}`;
  qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('[data-cart-count]').forEach((node) => {
    node.textContent = count;
  });
}

function discountRateForSubtotal(subtotal, tiers) {
  return Object.entries(tiers || {})
    .map(([threshold, rate]) => [Number(threshold), Number(rate)])
    .filter(([threshold, rate]) => Number.isFinite(threshold) && Number.isFinite(rate))
    .sort((a, b) => b[0] - a[0])
    .find(([threshold]) => subtotal > threshold)?.[1] || 0;
}

function changeQuantity(id, quantity) {
  const cart = getCart();
  const next = cart
    .map((item) => item.id === id ? { ...item, quantity } : item)
    .filter((item) => item.quantity > 0);
  saveCart(next);
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find((current) => current.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
}

function renderCartControls() {
  const cart = getCart();
  document.querySelectorAll('[data-cart-control]').forEach((control) => {
    const id = Number(control.dataset.id);
    const found = cart.find((item) => item.id === id);
    if (!found) {
      return;
    }
    control.innerHTML = `
      <div class="qty-control">
        <button type="button" data-qty="${id}" data-value="${found.quantity - 1}">-</button>
        <strong>${found.quantity}</strong>
        <button type="button" data-qty="${id}" data-value="${found.quantity + 1}">+</button>
      </div>
    `;
  });
}

function renderCheckout() {
  const cart = getCart();
  const target = document.querySelector('[data-checkout-items]');
  const activeIds = target?.dataset.activeItemIds ? JSON.parse(target.dataset.activeItemIds) : null;
  const gstRate = Number(target?.dataset.gstRate || 0);
  const discountTiers = target?.dataset.discountTiers ? JSON.parse(target.dataset.discountTiers) : {};
  const visibleCart = activeIds ? cart.filter((item) => activeIds.includes(Number(item.id))) : cart;
  const removedCount = activeIds ? cart.length - visibleCart.length : 0;
  const subtotal = visibleCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = Number((subtotal * gstRate).toFixed(2));
  const discountRate = discountRateForSubtotal(subtotal, discountTiers);
  const discount = Number((subtotal * discountRate).toFixed(2));
  const grandTotal = subtotal + gst - discount;
  document.querySelectorAll('[data-checkout-subtotal]').forEach((node) => node.textContent = money(subtotal));
  document.querySelectorAll('[data-checkout-gst]').forEach((node) => node.textContent = money(gst));
  document.querySelectorAll('[data-checkout-discount]').forEach((node) => node.textContent = money(discount));
  document.querySelectorAll('[data-checkout-total], [data-upi-total]').forEach((node) => node.textContent = money(grandTotal));
  updatePaymentQr(grandTotal);
  document.querySelectorAll('[data-cart-json]').forEach((node) => node.value = JSON.stringify(visibleCart));
  if (!target) return;

  if (!visibleCart.length) {
    target.innerHTML = removedCount
      ? '<p class="muted">Items in your cart are no longer active. Add available items from the menu.</p>'
      : '<p class="muted">Your cart is empty. Add items from the menu.</p>';
    return;
  }

  target.innerHTML = `${removedCount ? '<p class="alert">Some inactive items were removed from checkout.</p>' : ''}${visibleCart.map((item) => `
    <div class="checkout-item">
      <img src="${item.image}" alt="">
      <div>
        <strong>${item.name}</strong>
        <p>${money(item.price)} x ${item.quantity}</p>
      </div>
      <div class="checkout-actions">
        <strong>${money(item.price * item.quantity)}</strong>
        <button class="icon-remove" type="button" data-remove="${item.id}" aria-label="Remove ${item.name} from cart" title="Remove">
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M3 6h18"></path>
            <path d="M8 6V4h8v2"></path>
            <path d="M6 6l1 18h10l1-18"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('')}`;
}

document.addEventListener('click', (event) => {
  const add = event.target.closest('[data-add-cart]');
  if (add) {
    addToCart(JSON.parse(add.dataset.item));
  }

  const qty = event.target.closest('[data-qty]');
  if (qty) {
    changeQuantity(Number(qty.dataset.qty), Number(qty.dataset.value));
  }

  const remove = event.target.closest('[data-remove]');
  if (remove) {
    changeQuantity(Number(remove.dataset.remove), 0);
  }

  const navToggle = event.target.closest('[data-nav-toggle]');
  if (navToggle) {
    document.querySelector('[data-nav]')?.classList.toggle('open');
  }
});

document.querySelector('[data-menu-search]')?.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('[data-menu-item]').forEach((item) => {
    item.hidden = !item.dataset.name.includes(query);
  });
});

document.querySelector('[data-payment-method]')?.addEventListener('change', (event) => {
  const box = document.querySelector('[data-payment-box]');
  if (box) box.hidden = event.target.value !== 'UPI';
});

function syncDateGroup(group) {
  const day = group.querySelector('[data-date-day]')?.value;
  const month = group.querySelector('[data-date-month]')?.value;
  const year = group.querySelector('[data-date-year]')?.value;
  const target = group.querySelector('[data-date-value]');
  if (!target) return;

  target.value = day && month && year
    ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    : '';
}

document.querySelectorAll('[data-date-group]').forEach((group) => {
  group.addEventListener('change', () => syncDateGroup(group));
  syncDateGroup(group);
});

document.querySelector('[data-checkout-form]')?.addEventListener('submit', (event) => {
  const cartJson = document.querySelector('[data-cart-json]')?.value || '[]';
  const cart = JSON.parse(cartJson);
  if (!cart.length) {
    event.preventDefault();
    alert('Your cart is empty.');
    return;
  }

  const form = event.target;
  if (form?.hasAttribute('data-static-checkout')) {
    event.preventDefault();
    const formData = new FormData(form);
    const orderNumber = `ORD-${Date.now()}`;
    const total = document.querySelector('[data-checkout-total]')?.textContent || 'Rs. 0.00';
    const items = cart.map((item) => `${item.name} x ${item.quantity}`).join(', ');
    const number = String(formData.get('whatsapp_number') || '').replace(/\D+/g, '');
    const normalizedNumber = number.length === 10 ? `91${number}` : number;
    const message = [
      'Order Confirmed!',
      `Order ID: ${orderNumber}`,
      `Customer: ${formData.get('customer_name') || ''}`,
      `Items: ${items}`,
      `Total: ${total}`,
      '',
      "Thank you for ordering from Manisha's Kitchen.",
    ].join('\n');
    localStorage.removeItem(CART_KEY);
    window.open(`https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`, '_blank');
    window.location.href = '/';
  }
});

document.querySelectorAll('[data-availability-form]').forEach((form) => {
  const checkbox = form.querySelector('input[type="checkbox"]');
  const value = form.querySelector('[data-availability-value]');
  const label = form.querySelector('strong');
  if (!checkbox || !value || !label) return;

  checkbox.addEventListener('change', async () => {
    const previous = !checkbox.checked;
    value.value = checkbox.checked ? '1' : '0';
    checkbox.disabled = true;
    const actionUrl = new URL(form.getAttribute('action') || window.location.href, window.location.href).href;

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'fetch',
        },
      });
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        const preview = responseText.replace(/\s+/g, ' ').trim().slice(0, 80);
        throw new Error(response.redirected ? 'Your admin session expired. Please log in again.' : `The server returned an unexpected response: ${preview || response.status}`);
      }
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Could not update availability.');
      }

      checkbox.checked = result.is_available;
      value.value = result.is_available ? '1' : '0';
      label.textContent = result.label;
      label.classList.toggle('ok', result.is_available);
      label.classList.toggle('bad', !result.is_available);
    } catch (error) {
      checkbox.checked = previous;
      value.value = previous ? '1' : '0';
      alert(error.message || 'Could not update availability.');
    } finally {
      checkbox.disabled = false;
    }
  });
});

const success = document.querySelector('[data-clear-cart]');
if (success) {
  localStorage.removeItem(CART_KEY);
  const url = success.dataset.whatsapp;
  if (url) {
    setTimeout(() => window.open(url, '_blank'), 800);
  }
}

renderCartControls();
renderCheckout();
updateCartCount();
