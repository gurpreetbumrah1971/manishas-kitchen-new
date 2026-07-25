const STATIC_CATEGORIES = [
  { id: 1, name: 'Snacks', image: '/assets/food/optimized/poha.jpg', count: 10 },
  { id: 2, name: 'Meals', image: '/assets/food/optimized/chole-puri.jpg', count: 17 },
  { id: 3, name: 'Beverages', image: '/assets/food/optimized/iced-tea.jpg', count: 12 },
  { id: 4, name: 'Custom', image: '/assets/food/optimized/generated/custom-party-box-realistic.jpg', count: 1 },
];

const STATIC_MENU = [
  [1, 'Poha', 'Flattened rice seasoned with spices.', 30, 1, true, '/assets/food/optimized/generated/poha-realistic.jpg'],
  [2, 'Poha Usal', 'Poha served with spicy bean curry.', 40, 1, true, '/assets/food/optimized/generated/poha-usal-realistic.jpg'],
  [3, 'Upma', 'Savory semolina porridge.', 30, 1, true, '/assets/food/optimized/generated/upma-realistic.jpg'],
  [4, 'Uttapam', 'Thick rice pancake with toppings.', 60, 1, true, '/assets/food/optimized/generated/uttapam-realistic.jpg'],
  [5, 'Dhokla (Half)', 'Steamed gram flour cake (4 pieces).', 40, 1, true, '/assets/food/optimized/dhokla.jpg'],
  [6, 'Dhokla (Full)', 'Steamed gram flour cake (8 pieces).', 70, 1, true, '/assets/food/optimized/dhokla.jpg'],
  [7, 'Wada Pav', 'Spicy potato fritter in a bun.', 20, 1, true, '/assets/food/optimized/generated/wada-pav-realistic.jpg'],
  [8, 'Wada', 'Single spicy potato fritter.', 15, 1, true, '/assets/food/optimized/generated/wada-realistic.jpg'],
  [9, 'Pav', 'Single bread bun.', 5, 1, true, '/assets/food/optimized/generated/pav-realistic.jpg'],
  [10, 'Pav Bhaji', 'Spiced vegetable mash with buns.', 150, 1, true, '/assets/food/optimized/generated/pav-bhaji-realistic.jpg'],
  [11, 'Misal Pav', 'Spicy sprout curry topped with farsan, served with pav.', 80, 2, true, '/assets/food/optimized/misal-pav.jpg'],
  [12, 'Wada Usal Pav', 'Wada served with spicy sprout curry and pav.', 80, 2, true, '/assets/food/optimized/generated/wada-usal-pav-realistic.jpg'],
  [13, 'Aloo Paratha', 'Wheat flatbread stuffed with spiced potatoes.', 50, 2, true, '/assets/food/optimized/generated/aloo-paratha-realistic.jpg'],
  [14, 'Gobi Paratha', 'Wheat flatbread stuffed with spiced cauliflower.', 50, 2, true, '/assets/food/optimized/generated/gobi-paratha-realistic.jpg'],
  [15, 'Paneer Paratha', 'Wheat flatbread stuffed with spiced cottage cheese.', 80, 2, true, '/assets/food/optimized/generated/paneer-paratha-realistic.jpg'],
  [16, 'Methi Paratha', 'Wheat flatbread with fresh fenugreek leaves.', 50, 2, true, '/assets/food/optimized/generated/methi-paratha-realistic.jpg'],
  [17, 'Plain Paratha', 'Simple layered wheat flatbread.', 15, 2, true, '/assets/food/optimized/generated/plain-paratha-realistic.jpg'],
  [18, 'Chole Puri', 'Spicy chickpeas served with 4 fluffy fried puris.', 110, 2, true, '/assets/food/optimized/generated/chole-puri-realistic.jpg'],
  [19, 'Chole Bhature', 'Spicy chickpeas served with 2 large bhaturas.', 150, 2, true, '/assets/food/optimized/generated/chole-bhature-realistic.jpg'],
  [20, 'Chole Plate', 'A plate of spicy chickpeas (Chole only).', 80, 2, true, '/assets/food/optimized/generated/chole-plate-realistic.jpg'],
  [21, 'Puri Plate', 'A plate of 4 fluffy fried puris.', 40, 2, true, '/assets/food/optimized/generated/puri-plate-realistic.jpg'],
  [22, 'Bhatura', 'Single large fluffy fried bread.', 40, 2, true, '/assets/food/optimized/generated/bhatura-realistic.jpg'],
  [23, 'Egg Burji + 2 Pav (Single)', 'Spiced scrambled eggs served with 2 pav.', 40, 2, false, '/assets/food/optimized/generated/egg-burji-realistic.jpg'],
  [24, 'Egg Burji + 2 Pav (Double)', 'Double portion spiced scrambled eggs with 2 pav.', 80, 2, false, '/assets/food/optimized/generated/egg-burji-realistic.jpg'],
  [25, 'Egg Omelet + 2 Pav (Single)', 'Classic spiced omelet served with 2 pav.', 40, 2, false, '/assets/food/optimized/generated/egg-omelet-realistic.jpg'],
  [26, 'Egg Omelet + 2 Pav (Double)', 'Double portion spiced omelet with 2 pav.', 80, 2, false, '/assets/food/optimized/generated/egg-omelet-realistic.jpg'],
  [27, 'Butter Pav', 'Single pav toasted with generous butter.', 10, 2, true, '/assets/food/optimized/generated/butter-pav-realistic.jpg'],
  [28, 'Tea', 'Hot traditional Indian masala chai.', 15, 3, true, '/assets/food/optimized/tea-realistic.jpg'],
  [29, 'Hot Coffee', 'Freshly brewed hot coffee.', 30, 3, true, '/assets/food/optimized/generated/hot-coffee-realistic.jpg'],
  [30, 'Chaas', 'Refreshing spiced buttermilk.', 20, 3, true, '/assets/food/optimized/generated/chaas-realistic.jpg'],
  [31, 'Nimbu Pani', 'Classic fresh lime water.', 20, 3, true, '/assets/food/optimized/generated/nimbu-pani-realistic.jpg'],
  [32, 'Lemon Tea', 'Refreshing hot lemon tea.', 25, 3, true, '/assets/food/optimized/lemon-tea.jpg'],
  [33, 'Green Tea', 'Healthy and soothing hot green tea.', 25, 3, true, '/assets/food/optimized/generated/green-tea-realistic.jpg'],
  [34, 'Iced Tea', 'Chilled lemon infused iced tea.', 40, 3, true, '/assets/food/optimized/iced-tea.jpg'],
  [35, 'Watermelon Juice', 'Freshly squeezed watermelon juice.', 50, 3, true, '/assets/food/optimized/generated/watermelon-juice-realistic.jpg'],
  [36, 'Cold Coffee', 'Chilled creamy cold coffee.', 60, 3, true, '/assets/food/optimized/generated/cold-coffee-realistic.jpg'],
  [37, 'Chikoo Milkshake', 'Thick and creamy sapota shake.', 60, 3, true, '/assets/food/optimized/generated/chikoo-milkshake-realistic.jpg'],
  [38, 'Chocolate Milkshake', 'Rich and indulgent chocolate shake.', 90, 3, true, '/assets/food/optimized/generated/chocolate-milkshake-realistic.jpg'],
  [39, 'Mango Milkshake', 'Creamy shake made with fresh mangoes.', 120, 3, true, '/assets/food/optimized/generated/mango-milkshake-realistic.jpg'],
  [40, 'Custom Party Box', 'Your selection of snacks and sweets.', 999, 4, true, '/assets/food/optimized/generated/custom-party-box-realistic.jpg'],
].map(([id, name, description, price, categoryId, isVeg, image]) => ({ id, name, description, price, categoryId, isVeg, image }));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function currentCategoryId() {
  const value = new URLSearchParams(window.location.search).get('category');
  return value ? Number(value) : 0;
}

function renderStaticCategories() {
  const target = document.querySelector('[data-static-categories]');
  if (!target) return;

  target.innerHTML = STATIC_CATEGORIES.map((category) => `
    <a class="card category-card" href="/menu.html?category=${category.id}">
      <img src="${category.image}" alt="${escapeHtml(category.name)}">
      <div>
        <h3>${escapeHtml(category.name)}</h3>
        <p>${category.count} items</p>
      </div>
    </a>
  `).join('');
}

function renderStaticChips() {
  const target = document.querySelector('[data-static-chips]');
  if (!target) return;

  const activeId = currentCategoryId();
  target.innerHTML = `<a class="chip ${activeId ? '' : 'active'}" href="/menu.html">All</a>` + STATIC_CATEGORIES.map((category) => `
    <a class="chip ${activeId === category.id ? 'active' : ''}" href="/menu.html?category=${category.id}">
      ${escapeHtml(category.name)}
    </a>
  `).join('');
}

function renderStaticMenu() {
  const target = document.querySelector('[data-static-menu]');
  if (!target) return;

  const activeId = currentCategoryId();
  const items = activeId ? STATIC_MENU.filter((item) => item.categoryId === activeId) : STATIC_MENU;
  target.innerHTML = items.map((item) => {
    const cartItem = JSON.stringify({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
    return `
      <article class="card menu-card" data-menu-item data-name="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}">
        <div class="image-wrap">
          <img src="${item.image}" alt="${escapeHtml(item.name)}">
          <span class="badge ${item.isVeg ? 'veg' : 'nonveg'}">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
        </div>
        <div class="menu-body">
          <div class="menu-heading">
            <h3>${escapeHtml(item.name)}</h3>
            <strong>Rs. ${item.price.toFixed(2)}</strong>
          </div>
          <p>${escapeHtml(item.description)}</p>
          <div class="cart-control" data-cart-control data-id="${item.id}">
            <button class="btn primary full" type="button" data-add-cart data-item='${escapeHtml(cartItem)}'>Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function hydrateStaticCheckout() {
  const target = document.querySelector('[data-checkout-items]');
  if (target) {
    target.dataset.activeItemIds = JSON.stringify(STATIC_MENU.map((item) => item.id));
  }
}

renderStaticCategories();
renderStaticChips();
renderStaticMenu();
hydrateStaticCheckout();
