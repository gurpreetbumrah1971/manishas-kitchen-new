<?php
require_once __DIR__ . '/../includes/functions.php';
require_admin();

$cleanPages = [
    'orders' => 'orders.php',
    'menu' => 'menu.php',
    'customers' => 'customers.php',
    'settings' => 'settings.php',
];
if (!isset($adminTab) && isset($_GET['tab'], $cleanPages[$_GET['tab']])) {
    $params = $_GET;
    $tab = (string)$params['tab'];
    unset($params['tab']);
    redirect($cleanPages[$tab] . ($params ? '?' . http_build_query($params) : ''));
}

$tab = $adminTab ?? 'overview';
$pageTitle = [
    'overview' => 'Admin Dashboard',
    'orders' => 'Orders',
    'menu' => 'Menu Management',
    'customers' => 'Customers',
    'settings' => 'Settings',
][$tab] ?? 'Admin Dashboard';
$orders = fetch_orders();
$categories = fetch_categories(true);
$menuItems = fetch_menu(null, true);
$editItem = null;
if (isset($_GET['edit'])) {
    foreach ($menuItems as $item) {
        if ((int)$item['id'] === (int)$_GET['edit']) {
            $editItem = $item;
            $tab = 'menu';
            break;
        }
    }
}

$totalRevenue = array_reduce($orders, fn($sum, $order) => $sum + (float)$order['grand_total'], 0.0);
$pendingOrders = count(array_filter($orders, fn($order) => $order['status'] === 'PENDING'));
$completedOrders = count(array_filter($orders, fn($order) => $order['status'] === 'COMPLETED'));
$customers = [];
foreach ($orders as $order) {
    $number = $order['whatsapp_number'] ?: $order['mobile_number'];
    if (!isset($customers[$number])) {
        $customers[$number] = [
            'name' => $order['customer_name'],
            'number' => $number,
            'birthday' => $order['birthday'],
            'anniversary' => $order['anniversary'],
            'orders' => [],
            'total' => 0.0,
            'first' => $order['created_at'],
            'last' => $order['created_at'],
        ];
    }
    $customers[$number]['name'] = $order['customer_name'] ?: $customers[$number]['name'];
    $customers[$number]['birthday'] = $order['birthday'] ?: $customers[$number]['birthday'];
    $customers[$number]['anniversary'] = $order['anniversary'] ?: $customers[$number]['anniversary'];
    $customers[$number]['orders'][] = $order;
    $customers[$number]['total'] += (float)$order['grand_total'];
    $customers[$number]['first'] = min($customers[$number]['first'], $order['created_at']);
    $customers[$number]['last'] = max($customers[$number]['last'], $order['created_at']);
}
usort($customers, fn($a, $b) => strcmp($b['last'], $a['last']));

require_once __DIR__ . '/../includes/header.php';
?>
<section class="admin-layout">
    <aside class="admin-sidebar">
        <h2>Admin</h2>
        <a class="<?= $tab === 'overview' ? 'active' : '' ?>" href="dashboard.php">Overview</a>
        <a class="<?= $tab === 'orders' ? 'active' : '' ?>" href="orders.php">Orders</a>
        <a class="<?= $tab === 'menu' ? 'active' : '' ?>" href="menu.php">Menu</a>
        <a class="<?= $tab === 'customers' ? 'active' : '' ?>" href="customers.php">Customers</a>
        <a class="<?= $tab === 'settings' ? 'active' : '' ?>" href="settings.php">Settings</a>
        <a href="logout.php">Logout</a>
    </aside>

    <div class="admin-content">
        <?php if (!empty($_SESSION['admin_error'])): ?>
            <div class="alert"><?= e($_SESSION['admin_error']); unset($_SESSION['admin_error']); ?></div>
        <?php endif; ?>

        <?php if ($tab === 'overview'): ?>
            <h1>Dashboard</h1>
            <div class="stats-grid">
                <div class="stat-card"><span>Total Revenue</span><strong><?= rupee($totalRevenue) ?></strong></div>
                <div class="stat-card"><span>Total Orders</span><strong><?= count($orders) ?></strong></div>
                <div class="stat-card"><span>Pending Orders</span><strong><?= $pendingOrders ?></strong></div>
                <div class="stat-card"><span>Completed Orders</span><strong><?= $completedOrders ?></strong></div>
            </div>
            <?php render_orders_table(array_slice($orders, 0, 6), true); ?>
        <?php elseif ($tab === 'orders'): ?>
            <h1>All Orders</h1>
            <?php render_orders_table($orders, false); ?>
        <?php elseif ($tab === 'menu'): ?>
            <div class="toolbar">
                <div><h1>Menu Management</h1><p>Add, edit, delete and toggle availability.</p></div>
                <a class="btn secondary" href="menu.php">Add New Item</a>
            </div>
            <form class="card form-card" action="actions.php" method="post" enctype="multipart/form-data">
                <input type="hidden" name="action" value="save_item">
                <input type="hidden" name="item_id" value="<?= e($editItem['id'] ?? '') ?>">
                <h2><?= $editItem ? 'Edit Menu Item' : 'Add Menu Item' ?></h2>
                <div class="form-row">
                    <label>Name<input name="name" required value="<?= e($editItem['name'] ?? '') ?>"></label>
                    <label>Category
                        <select name="category_id" required>
                            <option value="">Select Category</option>
                            <?php foreach ($categories as $category): ?>
                                <option value="<?= (int)$category['id'] ?>" <?= ($editItem && (int)$editItem['category_id'] === (int)$category['id']) ? 'selected' : '' ?>>
                                    <?= e($category['name']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                    <label>Price<input type="number" min="1" step="0.01" name="price" required value="<?= e($editItem['price'] ?? '') ?>"></label>
                </div>
                <label>Description<textarea name="description" rows="3"><?= e($editItem['description'] ?? '') ?></textarea></label>
                <div class="form-row">
                    <label>Image URL<input name="image" value="<?= e($editItem['image'] ?? '') ?>"></label>
                    <label>Upload Image<input type="file" name="image_file" accept="image/*"></label>
                </div>
                <div class="inline-options">
                    <label><input type="checkbox" name="is_veg" <?= (!$editItem || $editItem['is_veg']) ? 'checked' : '' ?>> Veg item</label>
                    <label><input type="checkbox" name="is_available" <?= (!$editItem || $editItem['is_available']) ? 'checked' : '' ?>> Available</label>
                </div>
                <button class="btn primary" type="submit">Save Item</button>
            </form>
            <div class="card table-card">
                <table>
                    <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Availability</th><th>Actions</th></tr></thead>
                    <tbody>
                    <?php foreach ($menuItems as $item): ?>
                        <tr>
                            <td><div class="item-cell"><img src="<?= e(media_url($item['image'])) ?>" alt=""><span><strong><?= e($item['name']) ?></strong><small><?= $item['is_veg'] ? 'Veg' : 'Non-Veg' ?></small></span></div></td>
                            <td><?= e($item['category_name']) ?></td>
                            <td><?= rupee($item['price']) ?></td>
                            <td>
                                <form action="./actions.php" method="post" class="availability-toggle" data-availability-form>
                                    <input type="hidden" name="action" value="toggle_available">
                                    <input type="hidden" name="item_id" value="<?= (int)$item['id'] ?>">
                                    <input type="hidden" name="is_available" value="<?= $item['is_available'] ? '1' : '0' ?>" data-availability-value>
                                    <label>
                                        <input type="checkbox" <?= $item['is_available'] ? 'checked' : '' ?>>
                                        <span class="switch" aria-hidden="true"></span>
                                        <strong class="<?= $item['is_available'] ? 'ok' : 'bad' ?>"><?= $item['is_available'] ? 'Active' : 'Inactive' ?></strong>
                                    </label>
                                </form>
                            </td>
                            <td class="actions">
                                <a class="btn mini" href="menu.php?edit=<?= (int)$item['id'] ?>">Edit</a>
                                <form action="actions.php" method="post" onsubmit="return confirm('Delete <?= e($item['name']) ?>?')"><input type="hidden" name="action" value="delete_item"><input type="hidden" name="item_id" value="<?= (int)$item['id'] ?>"><button class="btn mini danger" type="submit">Delete</button></form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php elseif ($tab === 'customers'): ?>
            <h1>Customer LMS</h1>
            <form class="card form-card" action="actions.php" method="post" enctype="multipart/form-data">
                <input type="hidden" name="action" value="upload_campaign">
                <h2>Bulk WhatsApp Campaign</h2>
                <p class="muted">Upload optional image/video media, then use the generated media URL in your WhatsApp message.</p>
                <div class="form-row">
                    <label>Image / Video<input type="file" name="campaign_media" accept="image/*,video/*"></label>
                    <button class="btn secondary" type="submit">Upload Media</button>
                </div>
                <?php if (!empty($_SESSION['campaign_media'])): ?><p class="copy-box"><?= e($_SESSION['campaign_media']); unset($_SESSION['campaign_media']); ?></p><?php endif; ?>
            </form>
            <div class="card table-card">
                <table>
                    <thead><tr><th>Name</th><th>Number</th><th>Birthday</th><th>Anniversary</th><th>Orders</th><th>Total Spent</th><th>First</th><th>Last</th><th>Actions</th></tr></thead>
                    <tbody>
                    <?php foreach ($customers as $customer): ?>
                        <tr>
                            <td><?= e($customer['name']) ?></td>
                            <td><?= e($customer['number']) ?></td>
                            <td><?= e($customer['birthday'] ?: '-') ?></td>
                            <td><?= e($customer['anniversary'] ?: '-') ?></td>
                            <td><?= count($customer['orders']) ?></td>
                            <td><?= rupee($customer['total']) ?></td>
                            <td><?= e(substr($customer['first'], 0, 10)) ?></td>
                            <td><?= e(substr($customer['last'], 0, 10)) ?></td>
                            <td><a class="btn mini whatsapp" target="_blank" href="<?= e(whatsapp_url($customer['number'], customer_offer_message($customer))) ?>">Offer</a></td>
                        </tr>
                        <tr><td colspan="9"><details><summary>Order History</summary><?php foreach ($customer['orders'] as $order): ?><div class="history-row"><?= e($order['order_number']) ?> - <?= e($order['status']) ?> - <?= rupee($order['grand_total']) ?></div><?php endforeach; ?></details></td></tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <h1>Settings</h1>
            <div class="card form-card"><h2>General Settings</h2><p class="muted">Restaurant information, operating hours and availability preferences can be added here.</p></div>
        <?php endif; ?>
    </div>
</section>
<?php
function render_orders_table(array $orders, bool $limited): void { ?>
    <div class="card table-card">
        <div class="table-head"><h2><?= $limited ? 'Recent Orders' : 'Orders' ?></h2><?php if ($limited): ?><a href="orders.php">View All</a><?php endif; ?></div>
        <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
            <tbody>
            <?php foreach ($orders as $order): ?>
                <tr>
                    <td><strong><?= e($order['order_number']) ?></strong></td>
                    <td><?= e($order['customer_name']) ?><br><small><?= e($order['whatsapp_number'] ?: $order['mobile_number']) ?></small></td>
                    <td><?php foreach ($order['items'] as $item): ?><div><?= e($item['name']) ?> x <?= (int)$item['quantity'] ?></div><?php endforeach; ?></td>
                    <td><?= rupee($order['grand_total']) ?></td>
                    <td>
                        <form action="actions.php" method="post" class="status-form">
                            <input type="hidden" name="action" value="update_status">
                            <input type="hidden" name="order_id" value="<?= (int)$order['id'] ?>">
                            <select name="status" onchange="this.form.submit()">
                                <?php foreach (['PENDING', 'PREPARING', 'COMPLETED', 'DELIVERED', 'CANCELLED'] as $status): ?>
                                    <option value="<?= $status ?>" <?= $order['status'] === $status ? 'selected' : '' ?>><?= $status ?></option>
                                <?php endforeach; ?>
                            </select>
                        </form>
                    </td>
                    <td><?= e(date('d M Y, h:i A', strtotime($order['created_at']))) ?></td>
                    <td class="actions">
                        <a class="btn mini whatsapp" target="_blank" href="<?= e(whatsapp_url($order['whatsapp_number'] ?: $order['mobile_number'], order_confirmation_message($order))) ?>">Confirm</a>
                        <a class="btn mini whatsapp" target="_blank" href="<?= e(whatsapp_url($order['whatsapp_number'] ?: $order['mobile_number'], order_delivery_message($order))) ?>">Delivery</a>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$orders): ?><tr><td colspan="7" class="muted">No orders yet.</td></tr><?php endif; ?>
            </tbody>
        </table>
    </div>
<?php }
require_once __DIR__ . '/../includes/footer.php';
?>
