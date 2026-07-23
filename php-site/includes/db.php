<?php
declare(strict_types=1);

session_start();

function env_or_default(string $key, string $default): string
{
    $value = getenv($key);
    return $value === false || $value === '' ? $default : $value;
}

function database_url_config(): ?array
{
    $url = getenv('DATABASE_URL');
    if ($url === false || $url === '') {
        return null;
    }

    $parts = parse_url($url);
    if (!is_array($parts) || !in_array($parts['scheme'] ?? '', ['mysql', 'mariadb'], true)) {
        return null;
    }

    return [
        'host' => $parts['host'] ?? '127.0.0.1',
        'port' => isset($parts['port']) ? (string)$parts['port'] : '3306',
        'name' => isset($parts['path']) ? ltrim($parts['path'], '/') : 'spice_restaurant',
        'user' => isset($parts['user']) ? rawurldecode($parts['user']) : 'root',
        'pass' => isset($parts['pass']) ? rawurldecode($parts['pass']) : '',
    ];
}

$dbConfig = database_url_config() ?? [
    'host' => env_or_default('DB_HOST', '127.0.0.1'),
    'port' => env_or_default('DB_PORT', '3306'),
    'name' => env_or_default('DB_NAME', 'spice_restaurant'),
    'user' => env_or_default('DB_USER', 'root'),
    'pass' => env_or_default('DB_PASS', ''),
];

define('DB_HOST', $dbConfig['host']);
define('DB_PORT', $dbConfig['port']);
define('DB_NAME', $dbConfig['name']);
define('DB_USER', $dbConfig['user']);
define('DB_PASS', $dbConfig['pass']);

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    if (!getenv('DATABASE_URL') && !getenv('DB_HOST')) {
        $root = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';charset=utf8mb4', DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $root->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }

    $pdo = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    ensure_schema($pdo);
    return $pdo;
}

function ensure_schema(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    if (seed_data_exists($pdo)) {
        $ready = true;
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(191) NOT NULL UNIQUE,
            image VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS food_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(191) NOT NULL,
            description TEXT NULL,
            price DECIMAL(10,2) NOT NULL,
            image VARCHAR(500) NULL,
            is_veg TINYINT(1) NOT NULL DEFAULT 1,
            is_available TINYINT(1) NOT NULL DEFAULT 1,
            category_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_food_category (category_id),
            CONSTRAINT fk_food_category FOREIGN KEY (category_id) REFERENCES categories(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_number VARCHAR(64) NOT NULL UNIQUE,
            customer_name VARCHAR(191) NOT NULL,
            mobile_number VARCHAR(30) NOT NULL,
            whatsapp_number VARCHAR(30) NULL,
            birthday DATE NULL,
            anniversary DATE NULL,
            email VARCHAR(191) NULL,
            address TEXT NULL,
            table_number VARCHAR(30) NULL,
            order_type ENUM('DINE_IN','TAKEAWAY','DELIVERY') NOT NULL,
            payment_method ENUM('CASH','UPI','CARD') NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            grand_total DECIMAL(10,2) NOT NULL,
            status ENUM('PENDING','PREPARING','COMPLETED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            food_item_id INT NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            INDEX idx_order_items_order (order_id),
            INDEX idx_order_items_food (food_item_id),
            CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            CONSTRAINT fk_order_items_food FOREIGN KEY (food_item_id) REFERENCES food_items(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(191) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    seed_data($pdo);
    $ready = true;
}

function seed_data(PDO $pdo): void
{
    $imageMap = [
        'Poha' => 'assets/food/generated/poha-realistic.png',
        'Poha Usal' => 'assets/food/generated/poha-usal-realistic.png',
        'Upma' => 'assets/food/generated/upma-realistic.png',
        'Uttapam' => 'assets/food/generated/uttapam-realistic.png',
        'Wada' => 'assets/food/generated/wada-realistic.png',
        'Wada Pav' => 'assets/food/generated/wada-pav-realistic.png',
        'Pav' => 'assets/food/generated/pav-realistic.png',
        'Pav Bhaji' => 'assets/food/generated/pav-bhaji-realistic.png',
        'Wada Usal Pav' => 'assets/food/generated/wada-usal-pav-realistic.png',
        'Aloo Paratha' => 'assets/food/generated/aloo-paratha-realistic.png',
        'Gobi Paratha' => 'assets/food/generated/gobi-paratha-realistic.png',
        'Paneer Paratha' => 'assets/food/generated/paneer-paratha-realistic.png',
        'Methi Paratha' => 'assets/food/generated/methi-paratha-realistic.png',
        'Plain Paratha' => 'assets/food/generated/plain-paratha-realistic.png',
        'Chole Puri' => 'assets/food/generated/chole-puri-realistic.png',
        'Chole Bhature' => 'assets/food/generated/chole-bhature-realistic.png',
        'Chole Plate' => 'assets/food/generated/chole-plate-realistic.png',
        'Puri Plate' => 'assets/food/generated/puri-plate-realistic.png',
        'Bhatura' => 'assets/food/generated/bhatura-realistic.png',
        'Egg Burji + 2 Pav (Single)' => 'assets/food/generated/egg-burji-realistic.png',
        'Egg Burji + 2 Pav (Double)' => 'assets/food/generated/egg-burji-realistic.png',
        'Egg Omelet + 2 Pav (Single)' => 'assets/food/generated/egg-omelet-realistic.png',
        'Egg Omelet + 2 Pav (Double)' => 'assets/food/generated/egg-omelet-realistic.png',
        'Butter Pav' => 'assets/food/generated/butter-pav-realistic.png',
        'Hot Coffee' => 'assets/food/generated/hot-coffee-realistic.png',
        'Chaas' => 'assets/food/generated/chaas-realistic.png',
        'Nimbu Pani' => 'assets/food/generated/nimbu-pani-realistic.png',
        'Green Tea' => 'assets/food/generated/green-tea-realistic.png',
        'Watermelon Juice' => 'assets/food/generated/watermelon-juice-realistic.png',
        'Cold Coffee' => 'assets/food/generated/cold-coffee-realistic.png',
        'Chikoo Milkshake' => 'assets/food/generated/chikoo-milkshake-realistic.png',
        'Chocolate Milkshake' => 'assets/food/generated/chocolate-milkshake-realistic.png',
        'Pav Bhaji' => 'assets/food/generated/pav-bhaji-realistic.png',
        'Mango Milkshake' => 'assets/food/generated/mango-milkshake-realistic.png',
        'Tea' => 'assets/food/tea-realistic.png',
        'Custom Party Box' => 'assets/food/generated/custom-party-box-realistic.png',
    ];

    $adminCount = (int)$pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
    if ($adminCount === 0) {
        $stmt = $pdo->prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
        $stmt->execute(['admin', password_hash('admin123', PASSWORD_DEFAULT)]);
    }

    $itemCount = (int)$pdo->query('SELECT COUNT(*) FROM food_items')->fetchColumn();
    if ($itemCount > 0) {
        sync_menu_images($pdo, $imageMap);
        return;
    }

    $categories = [
        ['Snacks', 'assets/food/poha.png'],
        ['Meals', 'assets/food/chole-puri.png'],
        ['Beverages', 'assets/food/iced-tea.png'],
        ['Custom', 'assets/food/generated/custom-party-box-realistic.png'],
    ];

    $categoryIds = [];
    foreach ($categories as $category) {
        $stmt = $pdo->prepare('INSERT IGNORE INTO categories (name, image) VALUES (?, ?)');
        $stmt->execute($category);
        $idStmt = $pdo->prepare('SELECT id FROM categories WHERE name = ?');
        $idStmt->execute([$category[0]]);
        $categoryIds[$category[0]] = (int)$idStmt->fetchColumn();
    }

    $items = [
        ['Poha', 'Flattened rice seasoned with spices.', 30, 'Snacks', true, 'assets/food/generated/poha-realistic.png'],
        ['Poha Usal', 'Poha served with spicy bean curry.', 40, 'Snacks', true, 'assets/food/generated/poha-usal-realistic.png'],
        ['Upma', 'Savory semolina porridge.', 30, 'Snacks', true, 'assets/food/generated/upma-realistic.png'],
        ['Uttapam', 'Thick rice pancake with toppings.', 60, 'Snacks', true, 'assets/food/generated/uttapam-realistic.png'],
        ['Dhokla (Half)', 'Steamed gram flour cake (4 pieces).', 40, 'Snacks', true, 'assets/food/dhokla.jpeg'],
        ['Dhokla (Full)', 'Steamed gram flour cake (8 pieces).', 70, 'Snacks', true, 'assets/food/dhokla.jpeg'],
        ['Wada Pav', 'Spicy potato fritter in a bun.', 20, 'Snacks', true, 'assets/food/generated/wada-pav-realistic.png'],
        ['Wada', 'Single spicy potato fritter.', 15, 'Snacks', true, 'assets/food/generated/wada-realistic.png'],
        ['Pav', 'Single bread bun.', 5, 'Snacks', true, 'assets/food/generated/pav-realistic.png'],
        ['Pav Bhaji', 'Spiced vegetable mash with buns.', 150, 'Snacks', true, 'assets/food/generated/pav-bhaji-realistic.png'],
        ['Misal Pav', 'Spicy sprout curry topped with farsan, served with pav.', 80, 'Meals', true, 'assets/food/misal-pav.png'],
        ['Wada Usal Pav', 'Wada served with spicy sprout curry and pav.', 80, 'Meals', true, 'assets/food/generated/wada-usal-pav-realistic.png'],
        ['Aloo Paratha', 'Wheat flatbread stuffed with spiced potatoes.', 50, 'Meals', true, 'assets/food/generated/aloo-paratha-realistic.png'],
        ['Gobi Paratha', 'Wheat flatbread stuffed with spiced cauliflower.', 50, 'Meals', true, 'assets/food/generated/gobi-paratha-realistic.png'],
        ['Paneer Paratha', 'Wheat flatbread stuffed with spiced cottage cheese.', 80, 'Meals', true, 'assets/food/generated/paneer-paratha-realistic.png'],
        ['Methi Paratha', 'Wheat flatbread with fresh fenugreek leaves.', 50, 'Meals', true, 'assets/food/generated/methi-paratha-realistic.png'],
        ['Plain Paratha', 'Simple layered wheat flatbread.', 15, 'Meals', true, 'assets/food/generated/plain-paratha-realistic.png'],
        ['Chole Puri', 'Spicy chickpeas served with 4 fluffy fried puris.', 110, 'Meals', true, 'assets/food/generated/chole-puri-realistic.png'],
        ['Chole Bhature', 'Spicy chickpeas served with 2 large bhaturas.', 150, 'Meals', true, 'assets/food/generated/chole-bhature-realistic.png'],
        ['Chole Plate', 'A plate of spicy chickpeas (Chole only).', 80, 'Meals', true, 'assets/food/generated/chole-plate-realistic.png'],
        ['Puri Plate', 'A plate of 4 fluffy fried puris.', 40, 'Meals', true, 'assets/food/generated/puri-plate-realistic.png'],
        ['Bhatura', 'Single large fluffy fried bread.', 40, 'Meals', true, 'assets/food/generated/bhatura-realistic.png'],
        ['Egg Burji + 2 Pav (Single)', 'Spiced scrambled eggs served with 2 pav.', 40, 'Meals', false, 'assets/food/generated/egg-burji-realistic.png'],
        ['Egg Burji + 2 Pav (Double)', 'Double portion spiced scrambled eggs with 2 pav.', 80, 'Meals', false, 'assets/food/generated/egg-burji-realistic.png'],
        ['Egg Omelet + 2 Pav (Single)', 'Classic spiced omelet served with 2 pav.', 40, 'Meals', false, 'assets/food/generated/egg-omelet-realistic.png'],
        ['Egg Omelet + 2 Pav (Double)', 'Double portion spiced omelet with 2 pav.', 80, 'Meals', false, 'assets/food/generated/egg-omelet-realistic.png'],
        ['Butter Pav', 'Single pav toasted with generous butter.', 10, 'Meals', true, 'assets/food/generated/butter-pav-realistic.png'],
        ['Tea', 'Hot traditional Indian masala chai.', 15, 'Beverages', true, 'assets/food/tea-realistic.png'],
        ['Hot Coffee', 'Freshly brewed hot coffee.', 30, 'Beverages', true, 'assets/food/generated/hot-coffee-realistic.png'],
        ['Chaas', 'Refreshing spiced buttermilk.', 20, 'Beverages', true, 'assets/food/generated/chaas-realistic.png'],
        ['Nimbu Pani', 'Classic fresh lime water.', 20, 'Beverages', true, 'assets/food/generated/nimbu-pani-realistic.png'],
        ['Lemon Tea', 'Refreshing hot lemon tea.', 25, 'Beverages', true, 'assets/food/lemon-tea.png'],
        ['Green Tea', 'Healthy and soothing hot green tea.', 25, 'Beverages', true, 'assets/food/generated/green-tea-realistic.png'],
        ['Iced Tea', 'Chilled lemon infused iced tea.', 40, 'Beverages', true, 'assets/food/iced-tea.png'],
        ['Watermelon Juice', 'Freshly squeezed watermelon juice.', 50, 'Beverages', true, 'assets/food/generated/watermelon-juice-realistic.png'],
        ['Cold Coffee', 'Chilled creamy cold coffee.', 60, 'Beverages', true, 'assets/food/generated/cold-coffee-realistic.png'],
        ['Chikoo Milkshake', 'Thick and creamy sapota shake.', 60, 'Beverages', true, 'assets/food/generated/chikoo-milkshake-realistic.png'],
        ['Chocolate Milkshake', 'Rich and indulgent chocolate shake.', 90, 'Beverages', true, 'assets/food/generated/chocolate-milkshake-realistic.png'],
        ['Mango Milkshake', 'Creamy shake made with fresh mangoes.', 120, 'Beverages', true, 'assets/food/generated/mango-milkshake-realistic.png'],
        ['Custom Party Box', 'Your selection of snacks and sweets.', 999, 'Custom', true, 'assets/food/generated/custom-party-box-realistic.png'],
    ];

    $stmt = $pdo->prepare('
        INSERT INTO food_items (name, description, price, image, is_veg, is_available, category_id)
        VALUES (?, ?, ?, ?, ?, 1, ?)
    ');
    foreach ($items as $item) {
        $stmt->execute([$item[0], $item[1], $item[2], $item[5], $item[4] ? 1 : 0, $categoryIds[$item[3]]]);
    }
}

function seed_data_exists(PDO $pdo): bool
{
    try {
        $requiredTables = ['admins', 'categories', 'food_items', 'order_items', 'orders'];
        $placeholders = implode(',', array_fill(0, count($requiredTables), '?'));
        $stmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME IN ($placeholders)
        ");
        $stmt->execute([DB_NAME, ...$requiredTables]);
        if ((int)$stmt->fetchColumn() !== count($requiredTables)) {
            return false;
        }

        $adminCount = (int)$pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
        $categoryCount = (int)$pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();
        $itemCount = (int)$pdo->query('SELECT COUNT(*) FROM food_items')->fetchColumn();

        return $adminCount > 0 && $categoryCount > 0 && $itemCount > 0;
    } catch (Throwable) {
        return false;
    }
}

function sync_menu_images(PDO $pdo, array $imageMap): void
{
    $stmt = $pdo->prepare('UPDATE food_items SET image = ? WHERE name = ?');
    foreach ($imageMap as $name => $image) {
        $stmt->execute([$image, $name]);
    }
}
