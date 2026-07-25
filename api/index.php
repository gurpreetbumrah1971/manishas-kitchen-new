<?php
declare(strict_types=1);

ini_set('display_errors', '0');

function render_runtime_error(string $message, int $status = 500): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

set_exception_handler(function (Throwable $exception): void {
    render_runtime_error('Application startup failed: ' . $exception->getMessage());
});

register_shutdown_function(function (): void {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: text/plain; charset=utf-8');
        }
        echo 'Application fatal error: ' . $error['message'];
    }
});

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if ($requestPath === '/_health') {
    header('Content-Type: application/json');
    echo json_encode([
        'ok' => true,
        'php' => PHP_VERSION,
        'pdo_sqlite' => extension_loaded('pdo_sqlite'),
        'sqlite3' => extension_loaded('sqlite3'),
    ]);
    exit;
}

$baseDir = realpath(__DIR__ . '/../php-site');
if ($baseDir === false) {
    render_runtime_error('Application directory not found. The php-site files were not bundled into the Vercel function.');
}

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
    render_runtime_error('Page not found.', 404);
}

$_SERVER['SCRIPT_NAME'] = '/' . str_replace('\\', '/', $path);
$_SERVER['PHP_SELF'] = $_SERVER['SCRIPT_NAME'];
$_SERVER['SCRIPT_FILENAME'] = $target;

chdir(dirname($target));
require $target;
