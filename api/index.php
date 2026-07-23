<?php
declare(strict_types=1);

$baseDir = realpath(__DIR__ . '/../php-site');
if ($baseDir === false) {
    http_response_code(500);
    echo 'Application directory not found.';
    exit;
}

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = trim((string)($_GET['path'] ?? $requestPath), '/');
if ($path === '' || $path === 'api/index.php') {
    $path = 'index.php';
}

$path = preg_replace('#/+#', '/', $path) ?? $path;
if (!str_ends_with($path, '.php')) {
    $path = rtrim($path, '/') . '/index.php';
}

$target = realpath($baseDir . '/' . $path);
$isInsideApp = $target !== false && str_starts_with($target, $baseDir . DIRECTORY_SEPARATOR);
if ($target === false || !$isInsideApp || !is_file($target)) {
    http_response_code(404);
    echo 'Page not found.';
    exit;
}

$_SERVER['SCRIPT_NAME'] = '/' . str_replace('\\', '/', $path);
$_SERVER['PHP_SELF'] = $_SERVER['SCRIPT_NAME'];
$_SERVER['SCRIPT_FILENAME'] = $target;

chdir(dirname($target));
require $target;
