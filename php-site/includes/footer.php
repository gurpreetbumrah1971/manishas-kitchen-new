</main>
<?php if (!in_admin_area()): ?>
<a class="floating-cart-bar" href="<?= $assetBase ?>checkout.php" data-floating-cart hidden>
    <span>
        <strong>Your Order</strong>
        <span class="floating-cart-meta">
            <span data-cart-total>Rs. 0.00</span>
            <span data-cart-count>0 items</span>
        </span>
        <span class="floating-cart-nudge" data-discount-nudge hidden>
            <span data-discount-nudge-text></span>
            <img class="discount-star" src="data:image/gif;base64,R0lGODlhEAAQAPIAAP/MAf/eVv/2mf/7zP///wAAAAAAAAAAACH5BAEAAAUALAAAAAAQABAAAAM4WLrc/jDKSau9OOvNu/9gKI5kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyKRyyWw6n1CpAgA7" alt="" aria-hidden="true">
        </span>
    </span>
    <span class="floating-cart-action">View Cart</span>
</a>
<?php endif; ?>
<footer class="site-footer">
    <div>Manisha's Kitchen Order Booking System</div>
    <div>Dine-in, takeaway and delivery ordering with WhatsApp updates.</div>
</footer>
<script src="<?= $assetBase ?>assets/app.js?v=<?= filemtime(__DIR__ . '/../assets/app.js') ?>"></script>
</body>
</html>
