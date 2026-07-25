<?php
require_once __DIR__ . '/../includes/functions.php';
require_admin();

$type = $_GET['type'] ?? 'customers';
$orders = fetch_orders();

function csv_download(string $filename, array $headers, array $rows): never
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo "\xEF\xBB\xBF";
    $output = fopen('php://output', 'w');
    fputcsv($output, $headers);
    foreach ($rows as $row) {
        fputcsv($output, $row);
    }
    fclose($output);
    exit;
}

if ($type === 'orders') {
    $rows = array_map(function (array $order): array {
        $items = array_map(
            fn(array $item): string => $item['name'] . ' x ' . (int)$item['quantity'],
            $order['items'] ?? []
        );

        return [
            $order['order_number'],
            $order['customer_name'],
            $order['whatsapp_number'] ?: $order['mobile_number'],
            $order['birthday'],
            $order['anniversary'],
            $order['address'],
            implode('; ', $items),
            number_format((float)$order['total_amount'], 2, '.', ''),
            number_format((float)$order['gst_amount'], 2, '.', ''),
            number_format((float)$order['discount_amount'], 2, '.', ''),
            number_format((float)$order['grand_total'], 2, '.', ''),
            $order['payment_method'],
            $order['status'],
            $order['created_at'],
        ];
    }, $orders);

    csv_download('manishas-kitchen-orders.csv', [
        'Order Number',
        'Customer Name',
        'WhatsApp Number',
        'Birthday',
        'Anniversary',
        'Address',
        'Items',
        'Subtotal',
        'GST',
        'Discount',
        'Grand Total',
        'Payment Method',
        'Status',
        'Created At',
    ], $rows);
}

$customers = [];
foreach ($orders as $order) {
    $number = $order['whatsapp_number'] ?: $order['mobile_number'];
    if ($number === '') {
        continue;
    }

    if (!isset($customers[$number])) {
        $customers[$number] = [
            'name' => $order['customer_name'],
            'number' => $number,
            'birthday' => $order['birthday'],
            'anniversary' => $order['anniversary'],
            'address' => $order['address'],
            'orders' => 0,
            'total' => 0.0,
            'first' => $order['created_at'],
            'last' => $order['created_at'],
        ];
    }

    $customers[$number]['name'] = $order['customer_name'] ?: $customers[$number]['name'];
    $customers[$number]['birthday'] = $order['birthday'] ?: $customers[$number]['birthday'];
    $customers[$number]['anniversary'] = $order['anniversary'] ?: $customers[$number]['anniversary'];
    $customers[$number]['address'] = $order['address'] ?: $customers[$number]['address'];
    $customers[$number]['orders']++;
    $customers[$number]['total'] += (float)$order['grand_total'];
    $customers[$number]['first'] = min($customers[$number]['first'], $order['created_at']);
    $customers[$number]['last'] = max($customers[$number]['last'], $order['created_at']);
}

$rows = array_map(fn(array $customer): array => [
    $customer['name'],
    $customer['number'],
    $customer['birthday'],
    $customer['anniversary'],
    $customer['address'],
    $customer['orders'],
    number_format((float)$customer['total'], 2, '.', ''),
    $customer['first'],
    $customer['last'],
], array_values($customers));

csv_download('manishas-kitchen-customers.csv', [
    'Customer Name',
    'WhatsApp Number',
    'Birthday',
    'Anniversary',
    'Address',
    'Order Count',
    'Total Spent',
    'First Order At',
    'Last Order At',
], $rows);
