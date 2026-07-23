<?php
require_once __DIR__ . '/../includes/functions.php';
if (is_admin()) {
    redirect('dashboard.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = db()->prepare('SELECT * FROM admins WHERE username = ?');
    $stmt->execute([trim($_POST['username'] ?? '')]);
    $admin = $stmt->fetch();
    if ($admin && password_verify($_POST['password'] ?? '', $admin['password'])) {
        $_SESSION['admin_id'] = (int)$admin['id'];
        $_SESSION['admin_username'] = $admin['username'];
        redirect('dashboard.php');
    }
    $error = 'Invalid credentials.';
}
$pageTitle = 'Admin Login';
require_once __DIR__ . '/../includes/header.php';
?>
<section class="section compact auth-section">
    <form class="card auth-card" method="post">
        <h1>Admin Login</h1>
        <?php if ($error): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
        <label>Username<input name="username" required value="admin"></label>
        <label>Password<input type="password" name="password" required></label>
        <button class="btn primary full" type="submit">Login</button>
        <p class="muted">Default credentials: admin / admin123</p>
    </form>
</section>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
