<?php
$pageTitle = 'Menu';
require_once __DIR__ . '/includes/header.php';
$categoryId = isset($_GET['category']) ? max(0, (int)$_GET['category']) : null;
$categories = fetch_categories();
$items = fetch_menu($categoryId ?: null);
?>
<section class="section compact">
    <div class="toolbar">
        <div>
            <h1>Our Menu</h1>
            <p>Search, filter, and add dishes to your cart.</p>
        </div>
        <label class="search-box">
            <span>Search</span>
            <input type="search" data-menu-search placeholder="Search for dishes...">
        </label>
        <div class="veg-filter" data-veg-filter>
            <button class="active" type="button" data-veg-value="all">All</button>
            <button type="button" data-veg-value="veg">Veg</button>
            <button type="button" data-veg-value="nonveg">Non-Veg</button>
        </div>
    </div>

    <div class="chips">
        <a class="chip <?= !$categoryId ? 'active' : '' ?>" href="menu.php">All</a>
        <?php foreach ($categories as $category): ?>
            <?php if ((int)$category['food_count'] === 0) continue; ?>
            <a class="chip <?= $categoryId === (int)$category['id'] ? 'active' : '' ?>" href="menu.php?category=<?= (int)$category['id'] ?>">
                <?= e($category['name']) ?>
            </a>
        <?php endforeach; ?>
    </div>

    <div class="menu-grid">
        <?php foreach ($items as $item): ?>
            <article class="card menu-card" data-menu-item data-name="<?= e(strtolower($item['name'] . ' ' . $item['description'])) ?>" data-veg="<?= $item['is_veg'] ? 'veg' : 'nonveg' ?>">
                <div class="image-wrap">
                    <img src="<?= e(media_url($item['image'])) ?>" alt="<?= e($item['name']) ?>">
                    <span class="badge <?= $item['is_veg'] ? 'veg' : 'nonveg' ?>"><?= $item['is_veg'] ? 'Veg' : 'Non-Veg' ?></span>
                </div>
                <div class="menu-body">
                    <div class="menu-heading">
                        <h3><?= e($item['name']) ?></h3>
                        <strong><?= rupee($item['price']) ?></strong>
                    </div>
                    <p><?= e($item['description']) ?></p>
                    <div class="cart-control" data-cart-control data-id="<?= (int)$item['id'] ?>">
                        <button class="btn primary full" type="button" data-add-cart
                            data-item='<?= e(json_encode([
                                'id' => (int)$item['id'],
                                'name' => $item['name'],
                                'price' => (float)$item['price'],
                                'image' => media_url($item['image']),
                            ])) ?>'>Add to Cart</button>
                    </div>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
</section>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
