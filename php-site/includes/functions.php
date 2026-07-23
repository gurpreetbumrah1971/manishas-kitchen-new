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
