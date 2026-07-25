<?php
$pageTitle = 'Menu';
$bodyClass = 'menu-page';
require_once __DIR__ . '/includes/header.php';
$categories = array_values(array_filter(
    fetch_categories(),
    fn(array $category): bool => (int)$category['food_count'] > 0
));
$items = fetch_menu();
$itemsByCategory = [];
foreach ($items as $item) {
    $itemsByCategory[(int)$item['category_id']][] = $item;
}
$categories = array_values(array_filter(
    $categories,
    fn(array $category): bool => !empty($itemsByCategory[(int)$category['id']])
));
$requestedCategoryId = isset($_GET['category']) ? max(0, (int)$_GET['category']) : 0;
$availableCategoryIds = array_map(fn(array $category): int => (int)$category['id'], $categories);
$activeCategoryId = in_array($requestedCategoryId, $availableCategoryIds, true)
    ? $requestedCategoryId
    : (int)($availableCategoryIds[0] ?? 0);

$renderMenuItem = function (array $item): void { ?>
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
            <div class="cart-control" data-cart-control data-id="<?= (int)$item['id'] ?>"
                data-cart-item='<?= e(json_encode([
                    'id' => (int)$item['id'],
                    'name' => $item['name'],
                    'price' => (float)$item['price'],
                    'image' => media_url($item['image']),
                ])) ?>'>
                <button class="btn primary full" type="button" data-add-cart
                    data-item='<?= e(json_encode([
                        'id' => (int)$item['id'],
                        'name' => $item['name'],
                        'price' => (float)$item['price'],
                        'image' => media_url($item['image']),
                    ])) ?>'>Add</button>
            </div>
        </div>
    </article>
<?php };
?>
<section class="section compact order-menu-section">
    <div class="menu-app-shell">
    <div class="toolbar">
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

    <?php if (!$categories): ?>
        <p class="muted">No menu items are available right now.</p>
    <?php else: ?>
        <div class="menu-tabs-layout" data-menu-tabs>
            <div class="menu-tabs" role="tablist" aria-label="Menu sections">
                <?php foreach ($categories as $category): ?>
                    <?php $categoryId = (int)$category['id']; ?>
                    <button class="menu-tab <?= $categoryId === $activeCategoryId ? 'active' : '' ?>" type="button" role="tab"
                        id="menu-tab-<?= $categoryId ?>"
                        aria-controls="menu-panel-<?= $categoryId ?>"
                        aria-selected="<?= $categoryId === $activeCategoryId ? 'true' : 'false' ?>"
                        data-menu-tab="<?= $categoryId ?>">
                        <?= e($category['name']) ?>
                    </button>
                <?php endforeach; ?>
            </div>

            <?php foreach ($categories as $category): ?>
                <?php $categoryId = (int)$category['id']; ?>
                <section class="menu-tab-panel" id="menu-panel-<?= $categoryId ?>" role="tabpanel"
                    aria-labelledby="menu-tab-<?= $categoryId ?>"
                    data-menu-panel="<?= $categoryId ?>"
                    <?= $categoryId === $activeCategoryId ? '' : 'hidden' ?>>
                    <div class="menu-grid">
                        <?php foreach ($itemsByCategory[$categoryId] as $item): ?>
                            <?php $renderMenuItem($item); ?>
                        <?php endforeach; ?>
                    </div>
                </section>
            <?php endforeach; ?>
        </div>

        <div class="menu-accordion-layout">
            <?php foreach ($categories as $category): ?>
                <?php $categoryId = (int)$category['id']; ?>
                <details class="menu-accordion" <?= $categoryId === $activeCategoryId ? 'open' : '' ?>>
                    <summary><?= e($category['name']) ?></summary>
                    <div class="menu-grid">
                        <?php foreach ($itemsByCategory[$categoryId] as $item): ?>
                            <?php $renderMenuItem($item); ?>
                        <?php endforeach; ?>
                    </div>
                </details>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
    </div>
</section>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
