const CART_KEY = 'phpCart';
const ORDER_SESSION_KEY = 'mkOrderSession';
const INDEPENDENCE_BANNER_SEEN_KEY = 'mkIndependenceBannerSeenV3';
const APP_ASSET_BASE_URL = document.currentScript?.src
  ? new URL('.', document.currentScript.src).toString()
  : '/assets/';
const INDEPENDENCE_BANNER_URL = new URL('banners/independence-month-banner.jpg', APP_ASSET_BASE_URL).toString();
const DISCOUNT_TIERS = {
  400: 0.10,
  800: 0.15,
  1000: 0.20,
};
const FRONTEND_CATEGORY_ORDER = ['Parathas', 'Frankies', 'Kebabs', 'Pakodas', 'Egg Dishes', 'Snacks', 'Beverages'];
const FRONTEND_CATEGORY_INDEX = new Map(FRONTEND_CATEGORY_ORDER.map((name, index) => [name, index]));
const ADDITIONAL_STATIC_CATEGORIES = [
  { name: 'Kebabs', slug: 'kebabs' },
];
const ADDITIONAL_STATIC_MENU_ITEMS = [
  { id: 63, name: 'Mulli Paratha', description: 'Wheat flatbread stuffed with seasoned radish.', price: 65, categoryName: 'Parathas', isVeg: true, image: '/assets/food/photo-updates/muli-paratha.png' },
  { id: 64, name: 'Chicken Kheema Paratha', description: 'Wheat flatbread stuffed with spiced chicken kheema.', price: 100, categoryName: 'Parathas', isVeg: false, image: '/assets/food/photo-updates/chicken-kheema-paratha.png' },
  { id: 65, name: 'Corn Cheese Paratha', description: 'Wheat flatbread stuffed with sweet corn and cheese.', price: 100, categoryName: 'Parathas', isVeg: true, image: '/assets/food/photo-updates/corn-cheese-paratha.png' },
  { id: 66, name: 'Lorn Paratha', description: 'Wheat flatbread stuffed with seasoned vegetables.', price: 65, categoryName: 'Parathas', isVeg: true, image: '/assets/food/photo-updates/loki-paratha.png' },
  { id: 67, name: 'Chicken Galouti Kebab', description: 'Tender minced chicken kebab with aromatic spices.', price: 195, categoryName: 'Kebabs', isVeg: false, image: '/assets/food/photo-updates/chicken-kheema-paratha.png' },
  { id: 68, name: 'Chicken Shami Kebab', description: 'Spiced chicken and lentil kebab cooked until tender.', price: 195, categoryName: 'Kebabs', isVeg: false, image: '/assets/food/photo-updates/chicken-kheema-paratha.png' },
];

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

function getActiveOrderSession() {
  try {
    const session = JSON.parse(localStorage.getItem(ORDER_SESSION_KEY) || 'null');
    if (!session?.orderNumber || !session?.token || !session?.expiresAt) return null;
    if (Date.now() >= new Date(session.expiresAt).getTime()) {
      localStorage.removeItem(ORDER_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(ORDER_SESSION_KEY);
    return null;
  }
}

function saveOrderSession(session) {
  localStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(session));
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
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

function deliveryChargeForSubtotal(subtotal) {
  if (subtotal <= 0 || subtotal > 300) return 0;
  return subtotal < 150 ? 50 : 30;
}

function deliveryNudgeForSubtotal(subtotal) {
  if (subtotal <= 0) return '';
  if (subtotal > 300) return '(Free delivery unlocked)';
  return `(Add ${money(301 - subtotal)} more for free delivery)`;
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

function shouldShowIndependenceBanner() {
  const path = window.location.pathname.toLowerCase();
  const isMenuPage = document.body.classList.contains('menu-page')
    || path.endsWith('/menu.html')
    || path.endsWith('/menu.php')
    || path.endsWith('/index.html')
    || path === '/'
    || path === '';
  if (!isMenuPage) return false;

  try {
    return localStorage.getItem(INDEPENDENCE_BANNER_SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}

function showIndependenceBannerPopup() {
  if (!shouldShowIndependenceBanner()) return;

  try {
    localStorage.setItem(INDEPENDENCE_BANNER_SEEN_KEY, '1');
  } catch {
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'banner-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Independence month offer');
  overlay.innerHTML = `
    <div class="banner-lightbox-panel">
      <button class="banner-lightbox-close" type="button" aria-label="Close banner" data-banner-close>&times;</button>
      <img src="${escapeHtml(INDEPENDENCE_BANNER_URL)}" alt="Independence month special banner">
    </div>
  `;

  const closePopup = () => {
    overlay.remove();
    document.removeEventListener('keydown', handleEscape);
  };
  const handleEscape = (event) => {
    if (event.key === 'Escape') closePopup();
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-banner-close]')) {
      closePopup();
    }
  });
  document.addEventListener('keydown', handleEscape);
  document.body.appendChild(overlay);
  overlay.querySelector('[data-banner-close]')?.focus();
}

function categoryNameFromNode(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function normalizeStaticMenuCategories() {
  document.querySelectorAll('[data-menu-tabs]').forEach((tabGroup) => {
    const tabsContainer = tabGroup.querySelector('.menu-tabs');
    if (!tabsContainer) return;

    const panels = [...tabGroup.querySelectorAll('[data-menu-panel]')];
    const entries = [...tabsContainer.querySelectorAll('[data-menu-tab]')].map((tab) => {
      const name = categoryNameFromNode(tab);
      return {
        name,
        tab,
        panel: panels.find((panel) => panel.dataset.menuPanel === tab.dataset.menuTab),
      };
    });
    const orderedEntries = entries
      .filter((entry) => FRONTEND_CATEGORY_INDEX.has(entry.name))
      .sort((a, b) => FRONTEND_CATEGORY_INDEX.get(a.name) - FRONTEND_CATEGORY_INDEX.get(b.name));
    const activeEntry = orderedEntries.find((entry) => {
      const requestedCategory = new URLSearchParams(window.location.search).get('category');
      return requestedCategory && entry.tab.dataset.menuTab === requestedCategory;
    }) || orderedEntries[0];

    entries.forEach((entry) => {
      if (FRONTEND_CATEGORY_INDEX.has(entry.name)) return;
      entry.tab.remove();
      entry.panel?.remove();
    });
    orderedEntries.forEach((entry) => {
      tabsContainer.appendChild(entry.tab);
      if (entry.panel) tabGroup.appendChild(entry.panel);

      const isActive = entry === activeEntry;
      entry.tab.classList.toggle('active', isActive);
      entry.tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (entry.panel) entry.panel.hidden = !isActive;
    });
  });

  document.querySelectorAll('.menu-accordion-layout').forEach((layout) => {
    const entries = [...layout.querySelectorAll('.menu-accordion')].map((details) => ({
      name: categoryNameFromNode(details.querySelector('summary')),
      details,
    }));
    const orderedEntries = entries
      .filter((entry) => FRONTEND_CATEGORY_INDEX.has(entry.name))
      .sort((a, b) => FRONTEND_CATEGORY_INDEX.get(a.name) - FRONTEND_CATEGORY_INDEX.get(b.name));

    entries.forEach((entry) => {
      if (!FRONTEND_CATEGORY_INDEX.has(entry.name)) entry.details.remove();
    });
    orderedEntries.forEach((entry, index) => {
      layout.appendChild(entry.details);
      entry.details.open = index === 0;
    });
  });
}

function menuCardHtml(item) {
  const cartItem = JSON.stringify({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
  });
  return `
    <article class="card menu-card" data-menu-item data-name="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}" data-veg="${item.isVeg ? 'veg' : 'nonveg'}">
      <div class="image-wrap">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        <span class="badge ${item.isVeg ? 'veg' : 'nonveg'}">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
      </div>
      <div class="menu-body">
        <div class="menu-heading">
          <h3>${escapeHtml(item.name)}</h3>
          <strong>${money(item.price)}</strong>
        </div>
        <p>${escapeHtml(item.description)}</p>
        <div class="cart-control" data-cart-control data-id="${item.id}" data-cart-item='${escapeHtml(cartItem)}'>
          <button class="btn primary full" type="button" data-add-cart data-item='${escapeHtml(cartItem)}'>Add</button>
        </div>
      </div>
    </article>
  `;
}

function ensureStaticCategory(category) {
  document.querySelectorAll('[data-menu-tabs]').forEach((tabGroup) => {
    const tabsContainer = tabGroup.querySelector('.menu-tabs');
    if (!tabsContainer) return;

    const existingTab = [...tabsContainer.querySelectorAll('[data-menu-tab]')]
      .find((tab) => categoryNameFromNode(tab) === category.name);
    if (existingTab) return;

    const tab = document.createElement('button');
    tab.className = 'menu-tab';
    tab.type = 'button';
    tab.role = 'tab';
    tab.id = `menu-tab-${category.slug}`;
    tab.dataset.menuTab = category.slug;
    tab.setAttribute('aria-controls', `menu-panel-${category.slug}`);
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = category.name;

    const panel = document.createElement('section');
    panel.className = 'menu-tab-panel';
    panel.id = `menu-panel-${category.slug}`;
    panel.role = 'tabpanel';
    panel.dataset.menuPanel = category.slug;
    panel.setAttribute('aria-labelledby', tab.id);
    panel.hidden = true;

    const grid = document.createElement('div');
    grid.className = 'menu-grid';
    panel.appendChild(grid);

    tabsContainer.appendChild(tab);
    tabGroup.appendChild(panel);
  });

  document.querySelectorAll('.menu-accordion-layout').forEach((layout) => {
    const existingDetails = [...layout.querySelectorAll('.menu-accordion')]
      .find((details) => categoryNameFromNode(details.querySelector('summary')) === category.name);
    if (existingDetails) return;

    const details = document.createElement('details');
    details.className = 'menu-accordion';
    const summary = document.createElement('summary');
    summary.textContent = category.name;
    const grid = document.createElement('div');
    grid.className = 'menu-grid';
    details.append(summary, grid);
    layout.appendChild(details);
  });
}

function hydrateStaticMenuAdditions() {
  ADDITIONAL_STATIC_CATEGORIES.forEach(ensureStaticCategory);
  const itemsByCategory = ADDITIONAL_STATIC_MENU_ITEMS.reduce((groups, item) => {
    groups.set(item.categoryName, [...(groups.get(item.categoryName) || []), item]);
    return groups;
  }, new Map());

  itemsByCategory.forEach((items, categoryName) => {
    const categoryTabs = [...document.querySelectorAll('[data-menu-tab]')]
      .filter((tab) => categoryNameFromNode(tab) === categoryName);
    const panels = categoryTabs
      .map((tab) => [...document.querySelectorAll('[data-menu-panel]')]
        .find((panel) => panel.dataset.menuPanel === tab.dataset.menuTab))
      .filter(Boolean);

    document.querySelectorAll('.menu-accordion').forEach((details) => {
      if (categoryNameFromNode(details.querySelector('summary')) === categoryName) {
        panels.push(details);
      }
    });

    panels.forEach((panel) => {
      const grid = panel.querySelector('.menu-grid');
      if (!grid) return;
      const existingNames = new Set([...grid.querySelectorAll('.menu-card h3')].map((node) => categoryNameFromNode(node)));
      items.forEach((item) => {
      if (!existingNames.has(item.name)) {
        grid.insertAdjacentHTML('beforeend', menuCardHtml(item));
      }
    });
    });
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
  const deliveryCharge = deliveryChargeForSubtotal(subtotal);
  const grandTotal = subtotal + gst - discount + deliveryCharge;
  document.querySelectorAll('[data-checkout-subtotal]').forEach((node) => node.textContent = money(subtotal));
  document.querySelectorAll('[data-checkout-gst]').forEach((node) => node.textContent = money(gst));
  document.querySelectorAll('[data-checkout-discount]').forEach((node) => node.textContent = money(discount));
  document.querySelectorAll('[data-checkout-delivery]').forEach((node) => node.textContent = money(deliveryCharge));
  document.querySelectorAll('[data-delivery-nudge]').forEach((node) => node.textContent = deliveryNudgeForSubtotal(subtotal));
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

let orderStatusPollTimer = null;
let orderCountdownTimer = null;
let latestOrderStatus = null;

function clearOrderStatusTimers() {
  if (orderStatusPollTimer) {
    clearInterval(orderStatusPollTimer);
    orderStatusPollTimer = null;
  }
  if (orderCountdownTimer) {
    clearInterval(orderCountdownTimer);
    orderCountdownTimer = null;
  }
}

function statusMessage(status) {
  if (!status) return 'Waiting for kitchen confirmation.';
  if (status.statusLabel === 'CONFIRMED') return 'Order confirmed. The kitchen will start preparation shortly.';
  if (status.statusLabel === 'PREPARING') return 'Food is getting ready.';
  if (status.statusLabel === 'READY') return 'Your food is ready.';
  if (status.statusLabel === 'DELIVERED') return 'Delivered. Thank you for ordering from Manisha\'s Kitchen.';
  if (status.statusLabel === 'CANCELLED') return 'This order was cancelled.';
  return 'Waiting for kitchen confirmation.';
}

function updateOrderStatusPanel(status) {
  latestOrderStatus = status;
  const label = document.querySelector('[data-order-status-label]');
  const message = document.querySelector('[data-order-status-message]');
  const countdown = document.querySelector('[data-order-countdown]');
  const updated = document.querySelector('[data-order-status-updated]');
  if (!label || !message || !countdown) return;

  label.textContent = status?.statusLabel || 'PENDING';
  label.dataset.status = status?.statusLabel || 'PENDING';
  message.textContent = statusMessage(status);
  if (updated) {
    updated.textContent = status
      ? `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Checking status...';
  }

  if (status?.statusLabel === 'PREPARING' && status.preparationEndsAt) {
    const remaining = new Date(status.preparationEndsAt).getTime() - Date.now();
    countdown.hidden = false;
    countdown.textContent = remaining > 0
      ? `Estimated ready in ${formatCountdown(remaining)}`
      : 'Estimated ready any moment now';
    return;
  }

  countdown.hidden = true;
  countdown.textContent = '';
}

async function fetchOrderStatus(session) {
  if (!session?.orderNumber || !session?.token) return;
  try {
    const params = new URLSearchParams({ token: session.token });
    const response = await fetch(`/api/orders/${encodeURIComponent(session.orderNumber)}/status?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        localStorage.removeItem(ORDER_SESSION_KEY);
        clearOrderStatusTimers();
      }
      return;
    }
    updateOrderStatusPanel(await response.json());
  } catch {
    // Keep the current visible status; the next poll will retry.
  }
}

function startOrderStatusTracking(session) {
  clearOrderStatusTimers();
  updateOrderStatusPanel(null);
  fetchOrderStatus(session);
  orderStatusPollTimer = setInterval(() => fetchOrderStatus(session), 5000);
  orderCountdownTimer = setInterval(() => {
    if (latestOrderStatus) updateOrderStatusPanel(latestOrderStatus);
  }, 1000);
}

function showStaticOrderThankYou({ order, total, qrSrc, whatsappUrl, session }) {
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
      <div class="order-status-card">
        <span class="status-pill" data-order-status-label data-status="PENDING">PENDING</span>
        <strong data-order-status-message>Waiting for kitchen confirmation.</strong>
        <span class="order-countdown" data-order-countdown hidden></span>
        <span class="order-status-meta" data-order-status-updated>Checking status...</span>
      </div>
      <div class="thank-you-address">
        <strong>Manisha's Kitchen</strong>
        <span>Shop No. 02, Sai Proviso Krutika CHS, Plot 87, Sector 17,<br>Koparkhairane 400709</span>
        <span>Near Tej Vedant hospital</span>
      </div>
      <a class="btn primary" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">Send WhatsApp Confirmation</a>
      <a class="btn secondary" href="/menu.html">Back to Menu</a>
    </div>
  `;

  if (session) startOrderStatusTracking(session);
}

function restoreStaticOrderSession() {
  const section = document.querySelector('.checkout-page .section.compact');
  if (!section || getCart().length) return;

  const session = getActiveOrderSession();
  if (!session) return;

  showStaticOrderThankYou({
    order: { orderNumber: session.orderNumber },
    total: session.total || 'Rs. 0.00',
    qrSrc: session.qrSrc || '/assets/payment/mk-qrcode.jpg',
    whatsappUrl: session.whatsappUrl || '/menu.html',
    session,
  });
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
    const deliveryAmount = parseMoney(document.querySelector('[data-checkout-delivery]')?.textContent);
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
      deliveryAmount,
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
      const session = result.customerSessionToken && result.customerSessionExpiresAt
        ? {
          orderNumber,
          token: result.customerSessionToken,
          expiresAt: result.customerSessionExpiresAt,
          total,
          qrSrc,
          whatsappUrl,
        }
        : null;

      localStorage.removeItem(CART_KEY);
      if (session) saveOrderSession(session);
      updateCartCount();
      showStaticOrderThankYou({ order: result, total, qrSrc, whatsappUrl, session });
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

hydrateStaticMenuAdditions();
normalizeStaticMenuCategories();
renderCartControls();
renderCheckout();
updateCartCount();
restoreStaticOrderSession();
showIndependenceBannerPopup();
