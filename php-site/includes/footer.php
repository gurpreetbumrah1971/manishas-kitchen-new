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
<a class="floating-whatsapp-button" href="https://wa.me/918879630082" target="_blank" rel="noopener" aria-label="Send WhatsApp message to Manisha's Kitchen" title="WhatsApp">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12.04 2c-5.47 0-9.92 4.45-9.92 9.92 0 1.75.46 3.46 1.34 4.97L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.47 0 9.92-4.45 9.92-9.92S17.52 2 12.04 2Zm0 18.16h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.25-4.39c0-4.53 3.69-8.22 8.23-8.22a8.19 8.19 0 0 1 8.22 8.22c0 4.54-3.69 8.24-8.23 8.24Zm4.51-6.16c-.25-.12-1.47-.73-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.07-.25-.13-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.07-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.06s.89 2.39 1.02 2.56c.12.16 1.76 2.68 4.26 3.75.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.19-.06-.1-.23-.16-.48-.29Z"></path>
    </svg>
</a>
<?php endif; ?>
<footer class="site-footer">
    <div>Manisha's Kitchen Order Booking System</div>
    <div>Dine-in, takeaway and delivery ordering with WhatsApp updates.</div>
</footer>
<script src="<?= $assetBase ?>assets/app.js?v=<?= filemtime(__DIR__ . '/../assets/app.js') ?>"></script>
</body>
</html>
