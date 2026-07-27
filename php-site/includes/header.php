<?php require_once __DIR__ . '/functions.php'; ?>
<?php
$assetBase = in_admin_area() ? '../' : '';
$siteSettings = fetch_site_settings();
$promoEnabled = ($siteSettings['promo_banner_enabled'] ?? '0') === '1';
$promoText = trim((string)($siteSettings['promo_banner_text'] ?? ''));
$promoLinkLabel = trim((string)($siteSettings['promo_banner_link_label'] ?? ''));
$promoLinkUrl = trim((string)($siteSettings['promo_banner_link_url'] ?? ''));
$bodyClass = trim((string)($bodyClass ?? ''));
$bodyClasses = trim(($bodyClass !== '' ? $bodyClass . ' ' : '') . (in_admin_area() ? 'admin-app' : 'order-app'));
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($pageTitle ?? "Manisha's Kitchen") ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= $assetBase ?>assets/style.css">
</head>
<body class="<?= e($bodyClasses) ?>">
<?php if (!in_admin_area() && $promoEnabled && $promoText !== ''): ?>
    <div class="promo-banner">
        <div class="promo-track">
            <span><?= e($promoText) ?></span>
            <?php if ($promoLinkLabel !== '' && $promoLinkUrl !== ''): ?>
                <a href="<?= e($promoLinkUrl) ?>"><?= e($promoLinkLabel) ?></a>
            <?php endif; ?>
        </div>
    </div>
<?php endif; ?>
<header class="site-header">
    <a class="brand" href="<?= $assetBase ?>index.php">
        <img src="<?= $assetBase ?>assets/logo.png" alt="Manisha's Kitchen logo">
        <span>Manisha's Kitchen</span>
    </a>
    <a class="nav-icon-link instagram-link" href="https://www.instagram.com/manishaskitchen2026" target="_blank" rel="noopener" aria-label="Manisha's Kitchen on Instagram" title="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="3" y="3" width="18" height="18" rx="5"></rect>
            <circle cx="12" cy="12" r="4"></circle>
            <circle cx="17.5" cy="6.5" r="1.2"></circle>
        </svg>
    </a>
    <button class="nav-toggle" type="button" data-nav-toggle>Menu</button>
    <nav class="site-nav" data-nav>
        <a href="<?= $assetBase ?>menu.php">Menu</a>
        <a class="nav-order-link" href="<?= $assetBase ?>checkout.php">Your Order <span class="cart-count" data-cart-count>0 items</span></a>
        <?php if (in_admin_area()): ?>
            <a href="<?= $assetBase ?>admin/login.php">Admin</a>
        <?php endif; ?>
    </nav>
</header>
<main>
