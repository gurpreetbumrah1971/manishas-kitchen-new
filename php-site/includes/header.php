<?php require_once __DIR__ . '/functions.php'; ?>
<?php $assetBase = in_admin_area() ? '../' : ''; ?>
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
<body>
<header class="site-header">
    <a class="brand" href="<?= $assetBase ?>index.php">
        <img src="<?= $assetBase ?>assets/logo.png" alt="Manisha's Kitchen logo">
        <span>Manisha's Kitchen</span>
    </a>
    <button class="nav-toggle" type="button" data-nav-toggle>Menu</button>
    <nav class="site-nav" data-nav>
        <a href="<?= $assetBase ?>index.php">Home</a>
        <a href="<?= $assetBase ?>menu.php">Menu</a>
        <a href="<?= $assetBase ?>checkout.php">Checkout <span class="cart-count" data-cart-count>0</span></a>
        <a href="<?= $assetBase ?>admin/login.php">Admin</a>
    </nav>
</header>
<main>
