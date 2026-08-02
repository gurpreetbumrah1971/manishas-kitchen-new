<?php
$pageTitle = 'Your Order';
$bodyClass = 'checkout-page';
require_once __DIR__ . '/includes/header.php';
$successOrder = null;
$error = '';
$gstRate = 0.05;
$discountTiers = [
    1000 => 0.20,
    800 => 0.15,
    400 => 0.10,
];
$databaseReady = database_available();
$availableItems = fetch_menu();
$activeItemIds = array_map(fn($item) => (int)$item['id'], $availableItems);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $cart = json_decode($_POST['cart_json'] ?? '[]', true);
    if (!is_array($cart) || count($cart) === 0) {
        $error = 'Your cart is empty.';
    } elseif (trim($_POST['customer_name'] ?? '') === '' || trim($_POST['whatsapp_number'] ?? '') === '') {
        $error = 'Name and WhatsApp number are required.';
    } else {
        $ids = array_map(fn($item) => (int)$item['id'], $cart);
        $prices = [];
        if ($databaseReady) {
            $pdo = db();
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("SELECT id, price, name FROM food_items WHERE is_available = 1 AND id IN ($placeholders)");
            $stmt->execute($ids);
            foreach ($stmt->fetchAll() as $row) {
                $prices[(int)$row['id']] = $row;
            }
        } else {
            foreach ($availableItems as $item) {
                if (in_array((int)$item['id'], $ids, true)) {
                    $prices[(int)$item['id']] = $item;
                }
            }
        }

        $total = 0.0;
        $orderItems = [];
        foreach ($cart as $item) {
            $id = (int)($item['id'] ?? 0);
            $quantity = max(1, (int)($item['quantity'] ?? 1));
            if (!isset($prices[$id])) {
                $error = 'Invalid food item in cart. Please refresh the menu and try again.';
                break;
            }
            $unit = (float)$prices[$id]['price'];
            $subtotal = $unit * $quantity;
            $total += $subtotal;
            $orderItems[] = [$id, $quantity, $unit, $subtotal];
        }

        if (!$error) {
            $orderNumber = 'ORD-' . time() . random_int(100, 999);
            $gstAmount = round($total * $gstRate, 2);
            $discountRate = discount_rate($total);
            $discountAmount = round($total * $discountRate, 2);
            $grandTotal = round($total + $gstAmount - $discountAmount, 2);
            $orderType = 'DINE_IN';
            $paymentMethod = in_array($_POST['payment_method'] ?? '', ['CASH', 'UPI', 'CARD'], true) ? $_POST['payment_method'] : 'UPI';

            if ($databaseReady) {
                $pdo->beginTransaction();
                $orderSql = '
                    INSERT INTO orders
                        (order_number, customer_name, mobile_number, whatsapp_number, birthday, anniversary, address, table_number,
                         order_type, payment_method, total_amount, gst_amount, discount_amount, grand_total)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ';
                if (DB_DRIVER === 'pgsql') {
                    $orderSql .= ' RETURNING id';
                }
                $stmt = $pdo->prepare($orderSql);
                $stmt->execute([
                    $orderNumber,
                    trim($_POST['customer_name']),
                    trim($_POST['whatsapp_number']),
                    trim($_POST['whatsapp_number']),
                    $_POST['birthday'] ?: null,
                    $_POST['anniversary'] ?: null,
                    trim($_POST['address'] ?? '') ?: null,
                    null,
                    $orderType,
                    $paymentMethod,
                    $total,
                    $gstAmount,
                    $discountAmount,
                    $grandTotal,
                ]);
                $orderId = DB_DRIVER === 'pgsql' ? (int)$stmt->fetchColumn() : (int)$pdo->lastInsertId();
                $itemStmt = $pdo->prepare('INSERT INTO order_items (order_id, food_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)');
                foreach ($orderItems as $orderItem) {
                    $itemStmt->execute([$orderId, ...$orderItem]);
                }
                $pdo->commit();
            }

            $successOrder = [
                'order_number' => $orderNumber,
                'grand_total' => $grandTotal,
                'whatsapp_number' => trim($_POST['whatsapp_number']),
            ];
        }
    }
}
?>
<section class="section compact">
    <?php if ($successOrder): ?>
        <div class="success-panel" data-clear-cart data-whatsapp="<?= e(whatsapp_url($successOrder['whatsapp_number'], order_confirmation_message($successOrder))) ?>">
            <h1>Order Placed Successfully!</h1>
            <p>Your order is being prepared. A WhatsApp confirmation will open shortly.</p>
            <div class="thank-you-address">
                <strong>Manisha's Kitchen</strong>
                <span>Shop No. 02, Sai Proviso Krutika CHS, plot 87, sector 17, Koparkhairane 400709</span>
                <span>Near Tej Vedant hospital</span>
            </div>
            <a class="btn primary" href="index.php">Back Home</a>
        </div>
    <?php else: ?>
        <h1>Your Order</h1>
        <?php if ($error): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
        <div class="checkout-grid">
            <section class="card checkout-summary">
                <h2>Order Summary</h2>
                <div data-checkout-items data-active-item-ids="<?= e(json_encode($activeItemIds)) ?>" data-gst-rate="<?= e((string)$gstRate) ?>" data-discount-tiers="<?= e(json_encode($discountTiers)) ?>"></div>
                <div class="invoice-totals">
                    <div><span>Food Subtotal</span><strong data-checkout-subtotal>Rs. 0.00</strong></div>
                    <div><span>GST (5%)</span><strong data-checkout-gst>Rs. 0.00</strong></div>
                    <div><span>Discount</span><strong data-checkout-discount>Rs. 0.00</strong></div>
                </div>
                <div class="total-row grand">
                    <span>Grand Total</span>
                    <strong data-checkout-total>Rs. 0.00</strong>
                </div>
                <div class="discount-offer">
                    <strong>Discount offer</strong>
                    <ul>
                        <li>10% flat discount for orders above Rs. 400</li>
                        <li>15% flat discount for orders above Rs. 800</li>
                        <li>20% flat discount for orders above Rs. 1000</li>
                    </ul>
                </div>
                <a class="btn secondary full" href="menu.php">Add More Items</a>
            </section>
            <form class="card form-card" method="post" data-checkout-form>
                <input type="hidden" name="cart_json" data-cart-json>
                <label>Full Name *<input name="customer_name" required placeholder="Enter your name"></label>
                <label>WhatsApp Number *<input name="whatsapp_number" required inputmode="tel" placeholder="10-digit number"></label>
                <label>For home delivery, please enter address<textarea name="address" rows="3" placeholder="House / flat, street, landmark"></textarea></label>
                <div class="special-day-fields">
                    <p><strong>Your special day deserves more than just wishes!</strong><br><span>Let us know your birthday and anniversary and get a personalized surprise from us.</span></p>
                    <div class="form-row">
                        <?php render_date_dropdowns('birthday', 'Birthday Date'); ?>
                        <?php render_date_dropdowns('anniversary', 'Anniversary Date'); ?>
                    </div>
                </div>
                <label>Payment Method
                    <select name="payment_method" data-payment-method>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                    </select>
                </label>
                <div class="payment-box" data-payment-box>
                    <img class="qr" src="assets/payment/mk-qrcode.jpg" alt="UPI payment QR code" data-payment-qr data-static-src="assets/payment/mk-qrcode.jpg" data-upi-id="manishaskitchen2026@okaxis" data-payee-name="Manisha Chavan" data-upi-aid="uGICAgNCIlbShSw">
                    <p>Scan QR / use UPI ID: <strong>manishaskitchen2026@okaxis</strong></p>
                    <p>Amount: <strong data-upi-total>Rs. 0.00</strong></p>
                </div>
                <button class="btn primary full" type="submit">Book Order</button>
            </form>
        </div>
    <?php endif; ?>
</section>
<?php
function discount_rate(float $subtotal): float
{
    if ($subtotal >= 1000) {
        return 0.20;
    }
    if ($subtotal >= 800) {
        return 0.15;
    }
    if ($subtotal >= 400) {
        return 0.10;
    }
    return 0.0;
}

function render_date_dropdowns(string $name, string $label): void
{
    $months = [
        1 => 'January',
        2 => 'February',
        3 => 'March',
        4 => 'April',
        5 => 'May',
        6 => 'June',
        7 => 'July',
        8 => 'August',
        9 => 'September',
        10 => 'October',
        11 => 'November',
        12 => 'December',
    ];
    $currentYear = (int)date('Y');
    ?>
    <fieldset class="date-select-group" data-date-group="<?= e($name) ?>">
        <legend><?= e($label) ?></legend>
        <input type="hidden" name="<?= e($name) ?>" data-date-value>
        <select data-date-day aria-label="<?= e($label) ?> day">
            <option value="">Day</option>
            <?php for ($day = 1; $day <= 31; $day++): ?>
                <option value="<?= $day ?>"><?= $day ?></option>
            <?php endfor; ?>
        </select>
        <select data-date-month aria-label="<?= e($label) ?> month">
            <option value="">Month</option>
            <?php foreach ($months as $number => $month): ?>
                <option value="<?= $number ?>"><?= e($month) ?></option>
            <?php endforeach; ?>
        </select>
        <select data-date-year aria-label="<?= e($label) ?> year">
            <option value="">Year</option>
            <?php for ($year = $currentYear; $year >= 1920; $year--): ?>
                <option value="<?= $year ?>"><?= $year ?></option>
            <?php endfor; ?>
        </select>
    </fieldset>
<?php }
require_once __DIR__ . '/includes/footer.php'; ?>
