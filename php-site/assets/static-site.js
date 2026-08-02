const STATIC_CATEGORIES = [
  { id: 6, name: 'Parathas', image: '/assets/food/optimized/generated/aloo-paratha-realistic.jpg', count: 12 },
  { id: 4, name: 'Frankies', image: '/assets/food/optimized/generated/paneer-paratha-realistic.jpg', count: 3 },
  { id: 8, name: 'Kebabs', image: '/assets/food/photo-updates/chicken-kheema-paratha.png', count: 2 },
  { id: 5, name: 'Pakodas', image: '/assets/food/photo-updates/onion-pakoda.png', count: 4 },
  { id: 3, name: 'Egg Dishes', image: '/assets/food/optimized/generated/egg-omelet-realistic.jpg', count: 7 },
  { id: 7, name: 'Snacks', image: '/assets/food/optimized/poha.jpg', count: 13 },
  { id: 1, name: 'Beverages', image: '/assets/food/optimized/iced-tea.jpg', count: 12 },
];

const STATIC_MENU = [
  [1, 'Tea', 'Hot traditional Indian masala chai.', 25, 1, true, '/assets/food/optimized/tea-realistic.jpg'],
  [2, 'Hot Coffee', 'Freshly brewed hot coffee.', 35, 1, true, '/assets/food/optimized/generated/hot-coffee-realistic.jpg'],
  [3, 'Chaas', 'Refreshing spiced buttermilk.', 30, 1, true, '/assets/food/optimized/generated/chaas-realistic.jpg'],
  [4, 'Nimbu Pani', 'Classic fresh lime water.', 25, 1, true, '/assets/food/optimized/generated/nimbu-pani-realistic.jpg'],
  [5, 'Lemon Tea', 'Refreshing hot lemon tea.', 25, 1, true, '/assets/food/optimized/lemon-tea.jpg'],
  [6, 'Green Tea', 'Healthy and soothing hot green tea.', 30, 1, true, '/assets/food/optimized/generated/green-tea-realistic.jpg'],
  [7, 'Iced Tea', 'Chilled lemon infused iced tea.', 50, 1, true, '/assets/food/optimized/iced-tea.jpg'],
  [8, 'Watermelon Juice', 'Freshly squeezed watermelon juice.', 50, 1, true, '/assets/food/optimized/generated/watermelon-juice-realistic.jpg'],
  [9, 'Cold Coffee', 'Chilled creamy cold coffee.', 60, 1, true, '/assets/food/optimized/generated/cold-coffee-realistic.jpg'],
  [10, 'Chikoo Milkshake', 'Thick and creamy sapota shake.', 60, 1, true, '/assets/food/optimized/generated/chikoo-milkshake-realistic.jpg'],
  [11, 'Chocolate Milkshake', 'Rich and indulgent chocolate shake.', 90, 1, true, '/assets/food/optimized/generated/chocolate-milkshake-realistic.jpg'],
  [12, 'Mango Milkshake', 'Creamy shake made with fresh mangoes.', 120, 1, true, '/assets/food/optimized/generated/mango-milkshake-realistic.jpg'],
  [13, 'Veg Biryani', 'Fragrant rice layered with spiced vegetables.', 140, 2, true, '/assets/food/optimized/generated/custom-party-box-realistic.jpg'],
  [14, 'Egg Biryani', 'Fragrant rice layered with masala eggs.', 160, 2, false, '/assets/food/optimized/generated/egg-burji-realistic.jpg'],
  [43, 'Chicken Dum Biryani', 'Slow-cooked dum biryani with tender chicken and aromatic rice.', 225, 2, false, '/assets/food/optimized/generated/custom-party-box-realistic.jpg'],
  [44, 'Paneer Biryani', 'Aromatic biryani layered with spiced paneer and basmati rice.', 225, 2, true, '/assets/food/optimized/generated/paneer-paratha-realistic.jpg'],
  [15, 'Egg Burji + 2 Pav (Single)', 'Spiced scrambled eggs served with 2 pav.', 40, 3, false, '/assets/food/optimized/generated/egg-burji-realistic.jpg'],
  [16, 'Egg Burji + 2 Pav (Double)', 'Double portion spiced scrambled eggs with 2 pav.', 80, 3, false, '/assets/food/optimized/generated/egg-burji-realistic.jpg'],
  [17, 'Egg Omelet + 2 Pav (Single)', 'Classic spiced omelet served with 2 pav.', 40, 3, false, '/assets/food/optimized/generated/egg-omelet-realistic.jpg'],
  [18, 'Egg Omelet + 2 Pav (Double)', 'Double portion spiced omelet with 2 pav.', 80, 3, false, '/assets/food/optimized/generated/egg-omelet-realistic.jpg'],
  [19, 'Aloo Frankie', 'Soft roll filled with spiced potato and chutney.', 60, 4, true, '/assets/food/optimized/generated/aloo-paratha-realistic.jpg'],
  [20, 'Paneer Frankie', 'Soft roll filled with spiced paneer and onions.', 90, 4, true, '/assets/food/optimized/generated/paneer-paratha-realistic.jpg'],
  [21, 'Wada', 'Single spicy potato fritter.', 15, 5, true, '/assets/food/optimized/generated/wada-realistic.jpg'],
  [22, 'Wada Pav', 'Spicy potato fritter in a bun.', 20, 5, true, '/assets/food/optimized/generated/wada-pav-realistic.jpg'],
  [23, 'Onion Pakoda', 'Crisp onion fritters with house masala.', 50, 5, true, '/assets/food/optimized/generated/wada-realistic.jpg'],
  [24, 'Mix Pakoda', 'Assorted vegetable fritters fried crisp.', 70, 5, true, '/assets/food/optimized/generated/custom-party-box-realistic.jpg'],
  [25, 'Aloo Paratha', 'Wheat flatbread stuffed with spiced potatoes.', 60, 6, true, '/assets/food/optimized/generated/aloo-paratha-realistic.jpg'],
  [26, 'Gobi Paratha', 'Wheat flatbread stuffed with spiced cauliflower.', 60, 6, true, '/assets/food/optimized/generated/gobi-paratha-realistic.jpg'],
  [27, 'Paneer Paratha', 'Wheat flatbread stuffed with spiced cottage cheese.', 100, 6, true, '/assets/food/optimized/generated/paneer-paratha-realistic.jpg'],
  [28, 'Methi Paratha', 'Wheat flatbread with fresh fenugreek leaves.', 60, 6, true, '/assets/food/optimized/generated/methi-paratha-realistic.jpg'],
  [45, 'Palak Paratha', 'Wheat flatbread layered with spiced spinach.', 60, 6, true, '/assets/food/optimized/generated/methi-paratha-realistic.jpg'],
  [46, 'Cabbage Paratha', 'Wheat flatbread stuffed with seasoned cabbage.', 60, 6, true, '/assets/food/optimized/generated/gobi-paratha-realistic.jpg'],
  [47, 'Moong Daal Chilla', 'Savory moong dal pancake with mild spices.', 65, 6, true, '/assets/food/optimized/generated/uttapam-realistic.jpg'],
  [29, 'Plain Paratha', 'Simple layered wheat flatbread.', 20, 6, true, '/assets/food/optimized/generated/plain-paratha-realistic.jpg'],
  [63, 'Mulli Paratha', 'Wheat flatbread stuffed with seasoned radish.', 65, 6, true, '/assets/food/photo-updates/muli-paratha.png'],
  [64, 'Chicken Kheema Paratha', 'Wheat flatbread stuffed with spiced chicken kheema.', 100, 6, false, '/assets/food/photo-updates/chicken-kheema-paratha.png'],
  [65, 'Corn Cheese Paratha', 'Wheat flatbread stuffed with sweet corn and cheese.', 100, 6, true, '/assets/food/photo-updates/corn-cheese-paratha.png'],
  [66, 'Lorn Paratha', 'Wheat flatbread stuffed with seasoned vegetables.', 65, 6, true, '/assets/food/photo-updates/loki-paratha.png'],
  [67, 'Chicken Galouti Kebab', 'Tender minced chicken kebab with aromatic spices.', 195, 8, false, '/assets/food/photo-updates/chicken-kheema-paratha.png'],
  [68, 'Chicken Shami Kebab', 'Spiced chicken and lentil kebab cooked until tender.', 195, 8, false, '/assets/food/photo-updates/chicken-kheema-paratha.png'],
  [30, 'Poha', 'Flattened rice seasoned with spices.', 30, 7, true, '/assets/food/optimized/generated/poha-realistic.jpg'],
  [31, 'Poha Usal', 'Poha served with spicy bean curry.', 40, 7, true, '/assets/food/optimized/generated/poha-usal-realistic.jpg'],
  [32, 'Upma', 'Savory semolina porridge.', 30, 7, true, '/assets/food/optimized/generated/upma-realistic.jpg'],
  [33, 'Uttapam', 'Thick rice pancake with toppings.', 60, 7, true, '/assets/food/optimized/generated/uttapam-realistic.jpg'],
  [34, 'Dhokla (Half)', 'Steamed gram flour cake (4 pieces).', 40, 7, true, '/assets/food/optimized/dhokla.jpg'],
  [35, 'Dhokla (Full)', 'Steamed gram flour cake (8 pieces).', 70, 7, true, '/assets/food/optimized/dhokla.jpg'],
  [36, 'Pav', 'Single bread bun.', 5, 7, true, '/assets/food/optimized/generated/pav-realistic.jpg'],
  [37, 'Pav Bhaji', 'Spiced vegetable mash with buns.', 150, 7, true, '/assets/food/optimized/generated/pav-bhaji-realistic.jpg'],
  [38, 'Misal Pav', 'Spicy sprout curry topped with farsan, served with pav.', 80, 7, true, '/assets/food/optimized/misal-pav.jpg'],
  [39, 'Wada Usal Pav', 'Wada served with spicy sprout curry and pav.', 80, 7, true, '/assets/food/optimized/generated/wada-usal-pav-realistic.jpg'],
  [40, 'Chole Puri', 'Spicy chickpeas served with 4 fluffy fried puris.', 110, 7, true, '/assets/food/optimized/generated/chole-puri-realistic.jpg'],
  [41, 'Chole Bhature', 'Spicy chickpeas served with 2 large bhaturas.', 150, 7, true, '/assets/food/optimized/generated/chole-bhature-realistic.jpg'],
  [42, 'Chole Plate', 'A plate of spicy chickpeas (Chole only).', 80, 7, true, '/assets/food/optimized/generated/chole-plate-realistic.jpg'],
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
  return value ? Number(value) : STATIC_CATEGORIES[0].id;
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

function categoryLinks(className = '') {
  const activeId = currentCategoryId();
  return STATIC_CATEGORIES.map((category) => `
    <a class="${className} ${activeId === category.id ? 'active' : ''}" href="/menu.html?category=${category.id}">
      ${escapeHtml(category.name)}
    </a>
  `).join('');
}

function renderStaticCategoryNav() {
  const tabs = document.querySelector('[data-static-tabs]');
  const accordion = document.querySelector('[data-static-accordion]');
  if (tabs) {
    tabs.innerHTML = categoryLinks('category-tab');
  }
  if (accordion) {
    accordion.innerHTML = categoryLinks();
  }
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
      <article class="card menu-card" data-menu-item data-name="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}" data-veg="${item.isVeg ? 'veg' : 'nonveg'}">
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
renderStaticCategoryNav();
renderStaticMenu();
hydrateStaticCheckout();
