<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function e(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function in_admin_area(): bool
{
    return str_contains(str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? ''), '/admin/');
}

function media_url(?string $path): string
{
    $path = (string)$path;
    if ($path === '' || preg_match('#^https?://#i', $path) || str_starts_with($path, '/')) {
        return $path;
    }
    $path = preg_replace('#^(\.\./)?client/public/#', 'assets/', $path) ?? $path;
    if (preg_match('#^assets/food/(.+)\.(?:png|jpe?g)$#i', $path, $match)) {
        $optimized = 'assets/food/optimized/' . $match[1] . '.jpg';
        if (is_file(__DIR__ . '/../' . $optimized)) {
            $path = $optimized;
        }
    }
    return in_admin_area() ? '../' . $path : $path;
}

function rupee(float|int|string $amount): string
{
    return 'Rs. ' . number_format((float)$amount, 2);
}

function redirect(string $path): never
{
    header('Location: ' . $path);
    exit;
}

function is_admin(): bool
{
    return isset($_SESSION['admin_id']);
}

function require_admin(): void
{
    if (!is_admin()) {
        redirect('login.php');
    }
}

function normalize_mobile(string $value): string
{
    $digits = preg_replace('/\D+/', '', $value) ?? '';
    if (strlen($digits) === 10) {
        return '91' . $digits;
    }
    return $digits;
}

function whatsapp_url(string $number, string $message): string
{
    return 'https://wa.me/' . normalize_mobile($number) . '?text=' . rawurlencode($message);
}

function database_available(): bool
{
    try {
        db();
        return true;
    } catch (Throwable) {
        return false;
    }
}

function order_confirmation_message(array $order): string
{
    return implode("\n", [
        'Order Confirmed!',
        'Order ID: ' . $order['order_number'],
        'Total: Rs. ' . number_format((float)$order['grand_total'], 2),
        '',
        "Thank you for ordering from Manisha's Kitchen.",
    ]);
}

function order_delivery_message(array $order): string
{
    return implode("\n", [
        "Your order from Manisha's Kitchen is ready!",
        'Order ID: ' . $order['order_number'],
        'Total: Rs. ' . number_format((float)$order['grand_total'], 2),
        '',
        'Thank you for ordering with us.',
    ]);
}

function customer_offer_message(array $customer): string
{
    return implode("\n", [
        'Hi ' . ($customer['name'] ?: 'there') . '!',
        "Manisha's Kitchen has special offers waiting for your special day.",
        '',
        "Reply here to know today's offer.",
    ]);
}

function fetch_categories(bool $admin = false): array
{
    if (!database_available()) {
        return sample_categories();
    }

    $joinCondition = $admin ? 'f.category_id = c.id' : 'f.category_id = c.id AND f.is_available = 1';
    return db()->query("
        SELECT c.*, COUNT(f.id) AS food_count
        FROM categories c
        LEFT JOIN food_items f ON $joinCondition
        GROUP BY c.id
        ORDER BY c.id
    ")->fetchAll();
}

function fetch_menu(?int $categoryId = null, bool $admin = false): array
{
    if (!database_available()) {
        $items = sample_menu();
        if ($categoryId) {
            $items = array_values(array_filter($items, fn($item) => (int)$item['category_id'] === $categoryId));
        }
        return $items;
    }

    $sql = '
        SELECT f.*, c.name AS category_name
        FROM food_items f
        JOIN categories c ON c.id = f.category_id
        WHERE 1 = 1
    ';
    $params = [];
    if ($categoryId) {
        $sql .= ' AND f.category_id = ?';
        $params[] = $categoryId;
    }
    if (!$admin) {
        $sql .= ' AND f.is_available = 1';
    }
    $sql .= ' ORDER BY f.id';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function fetch_orders(): array
{
    if (!database_available()) {
        return [];
    }

    $orders = db()->query('SELECT * FROM orders ORDER BY created_at DESC')->fetchAll();
    $stmt = db()->prepare('
        SELECT oi.*, f.name, f.image
        FROM order_items oi
        JOIN food_items f ON f.id = oi.food_item_id
        WHERE oi.order_id = ?
        ORDER BY oi.id
    ');
    foreach ($orders as &$order) {
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll();
    }
    return $orders;
}

function sample_categories(): array
{
    return [
        ['id' => 1, 'name' => 'Snacks', 'image' => 'assets/food/poha.png', 'food_count' => 10],
        ['id' => 2, 'name' => 'Meals', 'image' => 'assets/food/chole-puri.png', 'food_count' => 17],
        ['id' => 3, 'name' => 'Beverages', 'image' => 'assets/food/iced-tea.png', 'food_count' => 12],
        ['id' => 4, 'name' => 'Custom', 'image' => 'assets/food/generated/custom-party-box-realistic.png', 'food_count' => 1],
    ];
}

function sample_menu(): array
{
    $items = [
        [1, 'Poha', 'Flattened rice seasoned with spices.', 30, 1, 'Snacks', 'assets/food/generated/poha-realistic.png'],
        [2, 'Poha Usal', 'Poha served with spicy bean curry.', 40, 1, 'Snacks', 'assets/food/generated/poha-usal-realistic.png'],
        [3, 'Upma', 'Savory semolina porridge.', 30, 1, 'Snacks', 'assets/food/generated/upma-realistic.png'],
        [4, 'Uttapam', 'Thick rice pancake with toppings.', 60, 1, 'Snacks', 'assets/food/generated/uttapam-realistic.png'],
        [5, 'Dhokla (Half)', 'Steamed gram flour cake (4 pieces).', 40, 1, 'Snacks', 'assets/food/dhokla.jpeg'],
        [6, 'Dhokla (Full)', 'Steamed gram flour cake (8 pieces).', 70, 1, 'Snacks', 'assets/food/dhokla.jpeg'],
        [7, 'Wada Pav', 'Spicy potato fritter in a bun.', 20, 1, 'Snacks', 'assets/food/generated/wada-pav-realistic.png'],
        [8, 'Wada', 'Single spicy potato fritter.', 15, 1, 'Snacks', 'assets/food/generated/wada-realistic.png'],
        [9, 'Pav', 'Single bread bun.', 5, 1, 'Snacks', 'assets/food/generated/pav-realistic.png'],
        [10, 'Pav Bhaji', 'Spiced vegetable mash with buns.', 150, 1, 'Snacks', 'assets/food/generated/pav-bhaji-realistic.png'],
        [11, 'Misal Pav', 'Spicy sprout curry topped with farsan, served with pav.', 80, 2, 'Meals', 'assets/food/misal-pav.png'],
        [12, 'Wada Usal Pav', 'Wada served with spicy sprout curry and pav.', 80, 2, 'Meals', 'assets/food/generated/wada-usal-pav-realistic.png'],
        [13, 'Aloo Paratha', 'Wheat flatbread stuffed with spiced potatoes.', 50, 2, 'Meals', 'assets/food/generated/aloo-paratha-realistic.png'],
        [14, 'Gobi Paratha', 'Wheat flatbread stuffed with spiced cauliflower.', 50, 2, 'Meals', 'assets/food/generated/gobi-paratha-realistic.png'],
        [15, 'Paneer Paratha', 'Wheat flatbread stuffed with spiced cottage cheese.', 80, 2, 'Meals', 'assets/food/generated/paneer-paratha-realistic.png'],
        [16, 'Methi Paratha', 'Wheat flatbread with fresh fenugreek leaves.', 50, 2, 'Meals', 'assets/food/generated/methi-paratha-realistic.png'],
        [17, 'Plain Paratha', 'Simple layered wheat flatbread.', 15, 2, 'Meals', 'assets/food/generated/plain-paratha-realistic.png'],
        [18, 'Chole Puri', 'Spicy chickpeas served with 4 fluffy fried puris.', 110, 2, 'Meals', 'assets/food/generated/chole-puri-realistic.png'],
        [19, 'Chole Bhature', 'Spicy chickpeas served with 2 large bhaturas.', 150, 2, 'Meals', 'assets/food/generated/chole-bhature-realistic.png'],
        [20, 'Chole Plate', 'A plate of spicy chickpeas (Chole only).', 80, 2, 'Meals', 'assets/food/generated/chole-plate-realistic.png'],
        [21, 'Puri Plate', 'A plate of 4 fluffy fried puris.', 40, 2, 'Meals', 'assets/food/generated/puri-plate-realistic.png'],
        [22, 'Bhatura', 'Single large fluffy fried bread.', 40, 2, 'Meals', 'assets/food/generated/bhatura-realistic.png'],
        [23, 'Egg Burji + 2 Pav (Single)', 'Spiced scrambled eggs served with 2 pav.', 40, 2, 'Meals', 'assets/food/generated/egg-burji-realistic.png', false],
        [24, 'Egg Burji + 2 Pav (Double)', 'Double portion spiced scrambled eggs with 2 pav.', 80, 2, 'Meals', 'assets/food/generated/egg-burji-realistic.png', false],
        [25, 'Egg Omelet + 2 Pav (Single)', 'Classic spiced omelet served with 2 pav.', 40, 2, 'Meals', 'assets/food/generated/egg-omelet-realistic.png', false],
        [26, 'Egg Omelet + 2 Pav (Double)', 'Double portion spiced omelet with 2 pav.', 80, 2, 'Meals', 'assets/food/generated/egg-omelet-realistic.png', false],
        [27, 'Butter Pav', 'Single pav toasted with generous butter.', 10, 2, 'Meals', 'assets/food/generated/butter-pav-realistic.png'],
        [28, 'Tea', 'Hot traditional Indian masala chai.', 15, 3, 'Beverages', 'assets/food/tea-realistic.png'],
        [29, 'Hot Coffee', 'Freshly brewed hot coffee.', 30, 3, 'Beverages', 'assets/food/generated/hot-coffee-realistic.png'],
        [30, 'Chaas', 'Refreshing spiced buttermilk.', 20, 3, 'Beverages', 'assets/food/generated/chaas-realistic.png'],
        [31, 'Nimbu Pani', 'Classic fresh lime water.', 20, 3, 'Beverages', 'assets/food/generated/nimbu-pani-realistic.png'],
        [32, 'Lemon Tea', 'Refreshing hot lemon tea.', 25, 3, 'Beverages', 'assets/food/lemon-tea.png'],
        [33, 'Green Tea', 'Healthy and soothing hot green tea.', 25, 3, 'Beverages', 'assets/food/generated/green-tea-realistic.png'],
        [34, 'Iced Tea', 'Chilled lemon infused iced tea.', 40, 3, 'Beverages', 'assets/food/iced-tea.png'],
        [35, 'Watermelon Juice', 'Freshly squeezed watermelon juice.', 50, 3, 'Beverages', 'assets/food/generated/watermelon-juice-realistic.png'],
        [36, 'Cold Coffee', 'Chilled creamy cold coffee.', 60, 3, 'Beverages', 'assets/food/generated/cold-coffee-realistic.png'],
        [37, 'Chikoo Milkshake', 'Thick and creamy sapota shake.', 60, 3, 'Beverages', 'assets/food/generated/chikoo-milkshake-realistic.png'],
        [38, 'Chocolate Milkshake', 'Rich and indulgent chocolate shake.', 90, 3, 'Beverages', 'assets/food/generated/chocolate-milkshake-realistic.png'],
        [39, 'Mango Milkshake', 'Creamy shake made with fresh mangoes.', 120, 3, 'Beverages', 'assets/food/generated/mango-milkshake-realistic.png'],
        [40, 'Custom Party Box', 'Your selection of snacks and sweets.', 999, 4, 'Custom', 'assets/food/generated/custom-party-box-realistic.png'],
    ];

    return array_map(fn($item) => [
        'id' => $item[0],
        'name' => $item[1],
        'description' => $item[2],
        'price' => $item[3],
        'category_id' => $item[4],
        'category_name' => $item[5],
        'image' => $item[6],
        'is_veg' => $item[7] ?? true,
        'is_available' => true,
    ], $items);
}

function upload_file(string $field, string $targetDir, array $allowedPrefixes): ?string
{
    if (empty($_FILES[$field]['name']) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload failed.');
    }
    if ($_FILES[$field]['size'] > 25 * 1024 * 1024) {
        throw new RuntimeException('Upload is too large.');
    }
    $mime = mime_content_type($_FILES[$field]['tmp_name']) ?: '';
    $allowed = false;
    foreach ($allowedPrefixes as $prefix) {
        if (str_starts_with($mime, $prefix)) {
            $allowed = true;
            break;
        }
    }
    if (!$allowed) {
        throw new RuntimeException('Unsupported upload type.');
    }

    $ext = strtolower(pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION));
    $filename = time() . '-' . bin2hex(random_bytes(5)) . ($ext ? '.' . $ext : '');
    $absoluteDir = __DIR__ . '/../' . trim($targetDir, '/');
    if (!is_dir($absoluteDir)) {
        mkdir($absoluteDir, 0775, true);
    }
    $absolutePath = $absoluteDir . '/' . $filename;
    if (!move_uploaded_file($_FILES[$field]['tmp_name'], $absolutePath)) {
        throw new RuntimeException('Could not save upload.');
    }
    return $targetDir . '/' . $filename;
}
