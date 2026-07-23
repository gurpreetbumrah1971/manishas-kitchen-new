<?php
$pageTitle = "Manisha's Kitchen";
require_once __DIR__ . '/includes/header.php';
$categories = fetch_categories();
?>
<section class="hero">
    <div class="hero-content">
        <h1>Savor the Authentic Flavors of Manisha's Kitchen</h1>
        <p>Experience Indian cuisine crafted with care, fresh ingredients, and traditional recipes.</p>
        <a class="btn primary" href="menu.php">Order Now</a>
    </div>
</section>

<section class="section">
    <div class="section-title">
        <h2>Explore Our Categories</h2>
        <p>Pick a category and start building your order.</p>
    </div>
    <div class="category-grid">
        <?php foreach ($categories as $category): ?>
            <?php if ((int)$category['food_count'] === 0) continue; ?>
            <a class="card category-card" href="menu.php?category=<?= (int)$category['id'] ?>">
                <img src="<?= e(media_url($category['image'])) ?>" alt="<?= e($category['name']) ?>">
                <div>
                    <h3><?= e($category['name']) ?></h3>
                    <p><?= (int)$category['food_count'] ?> items</p>
                </div>
            </a>
        <?php endforeach; ?>
    </div>
</section>

<section class="section split">
    <div>
        <h2>Why Manisha's Kitchen?</h2>
        <ul class="check-list">
            <li>Authentic traditional recipes</li>
            <li>Fresh and high-quality ingredients</li>
            <li>Fast dine-in, takeaway and delivery service</li>
            <li>WhatsApp order confirmations</li>
        </ul>
    </div>
    <img class="feature-image" src="<?= e(media_url('assets/food/generated/pav-bhaji-realistic.png')) ?>" alt="Pav bhaji">
</section>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
