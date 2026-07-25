<?php
require_once __DIR__ . '/../includes/functions.php';

function wants_json(): bool
{
    return str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
        || strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

if (!is_admin()) {
    if (wants_json()) {
        json_response(['ok' => false, 'error' => 'Your admin session expired. Please log in again.'], 401);
    }
    redirect('login.php');
}

$action = $_POST['action'] ?? '';
$pdo = db();

try {
    if ($action === 'update_status') {
        $status = in_array($_POST['status'] ?? '', ['PENDING', 'PREPARING', 'COMPLETED', 'DELIVERED', 'CANCELLED'], true)
            ? $_POST['status']
            : 'PENDING';
        $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?');
        $stmt->execute([$status, (int)$_POST['order_id']]);
        redirect('orders.php');
    }

    if ($action === 'save_item') {
        $name = trim($_POST['name'] ?? '');
        $price = (float)($_POST['price'] ?? 0);
        $categoryId = (int)($_POST['category_id'] ?? 0);
        if ($name === '' || $price <= 0 || $categoryId <= 0) {
            throw new RuntimeException('Name, price and menu are required.');
        }
        $image = trim($_POST['image'] ?? '');
        $upload = upload_file('image_file', 'uploads/menu', ['image/']);
        if ($upload) {
            $image = $upload;
        }
        if ($image === '') {
            $image = 'assets/food/generated/custom-party-box-realistic.png';
        }

        $payload = [
            $name,
            trim($_POST['description'] ?? ''),
            $price,
            $image,
            isset($_POST['is_veg']) ? 1 : 0,
            isset($_POST['is_available']) ? 1 : 0,
            $categoryId,
        ];

        if (!empty($_POST['item_id'])) {
            $stmt = $pdo->prepare('
                UPDATE food_items
                SET name = ?, description = ?, price = ?, image = ?, is_veg = ?, is_available = ?, category_id = ?
                WHERE id = ?
            ');
            $stmt->execute([...$payload, (int)$_POST['item_id']]);
        } else {
            $stmt = $pdo->prepare('
                INSERT INTO food_items (name, description, price, image, is_veg, is_available, category_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute($payload);
        }
        redirect('menu.php');
    }

    if ($action === 'toggle_available') {
        $itemId = (int)$_POST['item_id'];
        $nextAvailable = ($_POST['is_available'] ?? '0') === '1' ? 1 : 0;
        $stmt = $pdo->prepare('UPDATE food_items SET is_available = ? WHERE id = ?');
        $stmt->execute([$nextAvailable, $itemId]);
        if (wants_json()) {
            json_response([
                'ok' => true,
                'item_id' => $itemId,
                'is_available' => (bool)$nextAvailable,
                'label' => $nextAvailable ? 'Active' : 'Inactive',
            ]);
        }
        redirect('menu.php');
    }

    if ($action === 'delete_item') {
        $stmt = $pdo->prepare('DELETE FROM food_items WHERE id = ?');
        $stmt->execute([(int)$_POST['item_id']]);
        redirect('menu.php');
    }

    if ($action === 'save_settings') {
        $promoUrl = trim($_POST['promo_banner_link_url'] ?? '');
        if ($promoUrl !== '' && preg_match('#^\s*javascript:#i', $promoUrl)) {
            throw new RuntimeException('Promotion link URL is not allowed.');
        }

        save_site_settings([
            'promo_banner_enabled' => isset($_POST['promo_banner_enabled']) ? '1' : '0',
            'promo_banner_text' => trim($_POST['promo_banner_text'] ?? ''),
            'promo_banner_link_label' => trim($_POST['promo_banner_link_label'] ?? ''),
            'promo_banner_link_url' => $promoUrl,
        ]);
        $_SESSION['admin_success'] = 'Promotional banner settings saved.';
        redirect('settings.php');
    }

    if ($action === 'upload_campaign') {
        $upload = upload_file('campaign_media', 'uploads/campaign', ['image/', 'video/']);
        $_SESSION['campaign_media'] = $upload ?? '';
        redirect('customers.php');
    }

    if (wants_json()) {
        json_response(['ok' => false, 'error' => 'Invalid admin action. Refresh the page and try again.'], 400);
    }
} catch (Throwable $exception) {
    if (wants_json()) {
        json_response(['ok' => false, 'error' => $exception->getMessage()], 422);
    }
    $_SESSION['admin_error'] = $exception->getMessage();
    redirect('dashboard.php');
}

redirect('dashboard.php');
