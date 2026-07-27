const CART_KEY = 'phpCart';
const DISCOUNT_TIERS = {
  400: 0.10,
  800: 0.15,
  1000: 0.20,
};

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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function rupeeCompact(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
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

function parseMoney(value) {
  const amount = String(value || '').replace(/[^\d.]/g, '');
  return Number(amount || 0);
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  document.querySelectorAll('[data-cart-count]').forEach((node) => {
    node.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  });
  document.querySelectorAll('[data-cart-total]').forEach((node) => {
    node.textContent = money(subtotal);
  });
  document.querySelectorAll('[data-floating-cart]').forEach((node) => {
    node.hidden = count <= 0;
  });
  updateDiscountNudge(subtotal);
}

function discountRateForSubtotal(subtotal, tiers) {
  return Object.entries(tiers || {})
    .map(([threshold, rate]) => [Number(threshold), Number(rate)])
    .filter(([threshold, rate]) => Number.isFinite(threshold) && Number.isFinite(rate))
    .sort((a, b) => b[0] - a[0])
    .find(([threshold]) => subtotal >= threshold)?.[1] || 0;
}

function nextDiscountNudge(subtotal, tiers = DISCOUNT_TIERS) {
  if (subtotal <= 0) return '';

  const orderedTiers = Object.entries(tiers)
    .map(([threshold, rate]) => [Number(threshold), Number(rate)])
    .filter(([threshold, rate]) => Number.isFinite(threshold) && Number.isFinite(rate))
    .sort((a, b) => a[0] - b[0]);
  const currentTier = [...orderedTiers]
    .reverse()
    .find(([threshold]) => subtotal >= threshold);
  const nextTier = orderedTiers.find(([threshold]) => subtotal < threshold);

  if (currentTier && !nextTier) {
    const currentSavings = subtotal * currentTier[1];
    return `Thank you! You're saving ${rupeeCompact(currentSavings)} with our highest discount.`;
  }

  if (currentTier && nextTier) {
    const currentSavings = subtotal * currentTier[1];
    const [nextThreshold, nextRate] = nextTier;
    const amountAway = Math.max(0, nextThreshold - subtotal);
    const nextSavings = nextThreshold * nextRate;
    return `Congrats! You're saving ${rupeeCompact(currentSavings)}. Add ${rupeeCompact(amountAway)} more to save ${rupeeCompact(nextSavings)}.`;
  }

  if (!nextTier) return '';

  const [threshold, rate] = nextTier;
  const amountAway = Math.max(0, threshold - subtotal);
  const savings = threshold * rate;
  return `You're just ${rupeeCompact(amountAway)} away from saving ${rupeeCompact(savings)}!`;
}

function updateDiscountNudge(subtotal) {
  const message = nextDiscountNudge(subtotal);
  document.querySelectorAll('[data-discount-nudge]').forEach((node) => {
    const text = node.querySelector('[data-discount-nudge-text]');
    if (text) {
      text.textContent = message;
    } else {
      node.textContent = message;
    }
    node.hidden = message === '';
  });
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
      if (control.dataset.cartItem) {
        const button = document.createElement('button');
        button.className = 'btn primary full';
        button.type = 'button';
        button.dataset.addCart = '';
        button.dataset.item = control.dataset.cartItem;
        button.textContent = 'Add';
        control.replaceChildren(button);
      }
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

  target.innerHTML = `${removedCount ? '<p class="alert">Some inactive items were removed from checkout.</p>' : ''}${visibleCart.map((item) => {
    const itemId = Number(item.id);
    const itemName = escapeHtml(item.name);
    const quantity = Number(item.quantity || 0);
    return `
    <div class="checkout-item">
      <strong class="checkout-item-name">${itemName}</strong>
      <div class="qty-control checkout-qty-control" aria-label="Quantity for ${itemName}">
        <button type="button" data-qty="${itemId}" data-value="${quantity - 1}" aria-label="Decrease ${itemName} quantity">-</button>
        <strong>${quantity}</strong>
        <button type="button" data-qty="${itemId}" data-value="${quantity + 1}" aria-label="Increase ${itemName} quantity">+</button>
      </div>
      <strong class="checkout-line-price">${money(item.price * quantity)}</strong>
      <button class="icon-remove" type="button" data-remove="${itemId}" aria-label="Remove ${itemName} from cart" title="Remove">
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M6 6l1 18h10l1-18"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>
      </button>
    </div>
  `;
  }).join('')}`;
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

  const menuTab = event.target.closest('[data-menu-tab]');
  if (menuTab) {
    const tabGroup = menuTab.closest('[data-menu-tabs]');
    const activeCategory = menuTab.dataset.menuTab;
    tabGroup?.querySelectorAll('[data-menu-tab]').forEach((tab) => {
      const isActive = tab === menuTab;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    tabGroup?.querySelectorAll('[data-menu-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.menuPanel !== activeCategory;
    });
    applyMenuFilters();
  }
});

function applyMenuFilters() {
  const query = document.querySelector('[data-menu-search]')?.value.toLowerCase() || '';
  const vegMode = document.querySelector('[data-veg-filter] .active')?.dataset.vegValue || 'all';
  document.querySelectorAll('[data-menu-item]').forEach((item) => {
    const matchesSearch = item.dataset.name.includes(query);
    const matchesVeg = vegMode === 'all' || item.dataset.veg === vegMode;
    item.hidden = !matchesSearch || !matchesVeg;
  });
}

document.querySelector('[data-menu-search]')?.addEventListener('input', applyMenuFilters);

document.querySelector('[data-veg-filter]')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-veg-value]');
  if (!button) return;

  document.querySelectorAll('[data-veg-filter] [data-veg-value]').forEach((node) => {
    node.classList.toggle('active', node === button);
  });
  applyMenuFilters();
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

function showStaticOrderThankYou({ order, total, qrSrc, whatsappUrl }) {
  const section = document.querySelector('.checkout-page .section.compact');
  if (!section) return;

  section.innerHTML = `
    <div class="success-panel checkout-thank-you">
      <h1>Thank you for your order!</h1>
      <p>Your order has been received.</p>
      <div class="thank-you-total">
        <span>Total Amount</span>
        <strong>${escapeHtml(total)}</strong>
      </div>
      <div class="payment-box thank-you-payment">
        <img class="qr" src="${escapeHtml(qrSrc)}" alt="UPI payment QR code">
        <p>Scan QR / use UPI ID: <strong>manishaskitchen2026@okaxis</strong></p>
        <p>Order ID: <strong>${escapeHtml(order.orderNumber || order.order_number || '')}</strong></p>
      </div>
      <a class="btn primary" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">Send WhatsApp Confirmation</a>
      <a class="btn secondary" href="/menu.html">Back to Menu</a>
    </div>
  `;
}

document.querySelector('[data-checkout-form]')?.addEventListener('submit', async (event) => {
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
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent || 'Book Order';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Placing Order...';
    }

    const formData = new FormData(form);
    const subtotal = parseMoney(document.querySelector('[data-checkout-subtotal]')?.textContent);
    const gstAmount = parseMoney(document.querySelector('[data-checkout-gst]')?.textContent);
    const discountAmount = parseMoney(document.querySelector('[data-checkout-discount]')?.textContent);
    const grandTotal = parseMoney(document.querySelector('[data-checkout-total]')?.textContent);
    const total = document.querySelector('[data-checkout-total]')?.textContent || money(grandTotal);
    const items = cart.map((item) => `${item.name} x ${item.quantity}`).join(', ');
    const number = String(formData.get('whatsapp_number') || '').replace(/\D+/g, '');
    const normalizedNumber = number.length === 10 ? `91${number}` : number;
    const orderPayload = {
      customerName: String(formData.get('customer_name') || '').trim(),
      mobileNumber: String(formData.get('whatsapp_number') || '').trim(),
      whatsappNumber: String(formData.get('whatsapp_number') || '').trim(),
      birthday: formData.get('birthday') || null,
      anniversary: formData.get('anniversary') || null,
      address: String(formData.get('address') || '').trim() || null,
      orderType: 'DINE_IN',
      paymentMethod: formData.get('payment_method') || 'UPI',
      totalAmount: subtotal,
      gstAmount,
      discountAmount,
      grandTotal,
      items: cart.map((item) => ({
        foodItemId: Number(item.id),
        name: item.name,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.price || 0),
        subtotal: Number(item.price || 0) * Number(item.quantity || 1),
      })),
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order.');
      }

      const orderNumber = result.orderNumber || result.order_number || `ORD-${Date.now()}`;
      const qrSrc = document.querySelector('[data-payment-qr]')?.src || 'assets/payment/mk-qrcode.jpg';
      const whatsappUrl = `https://wa.me/${normalizedNumber}?text=${encodeURIComponent([
        'Order Confirmed!',
        `Order ID: ${orderNumber}`,
        `Customer: ${orderPayload.customerName}`,
        `Items: ${items}`,
        `Total: ${total}`,
        '',
        "Thank you for ordering from Manisha's Kitchen.",
      ].join('\n'))}`;

      localStorage.removeItem(CART_KEY);
      updateCartCount();
      showStaticOrderThankYou({ order: result, total, qrSrc, whatsappUrl });
    } catch (error) {
      alert(error.message || 'Failed to place order. Please try again.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
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
