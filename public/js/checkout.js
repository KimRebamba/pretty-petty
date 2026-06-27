$(document).ready(function () {
    const API = 'http://localhost:3000';
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    PrettyPettyUI.initButtons('button, input[type="submit"]');

    // ── Alert banner ──
    (function() {
        const params = new URLSearchParams(window.location.search);
        const msg = params.get('msg');
        if (msg) {
            const $b = $('#alert-banner');
            let text = '';
            if (msg === 'login_required') text = 'You need to be logged in to access that page. <a href="login.html">Log in</a> or <a href="register.html">create an account</a>.';
            else if (msg === 'admin_required') text = 'You do not have permission to access that page.';
            else if (msg === 'access_denied') text = 'Access denied.';
            else text = msg;
            $b.html(text).slideDown(200);
            window.history.replaceState({}, '', window.location.pathname);
        }
    })();

    // ── User state ──
    function initUserState() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const t = localStorage.getItem('token');
        if (t && user && user.id) {
            $('#nav-auth-links').hide();
            $('#nav-user').css('display', 'flex');
            $('.nav-auth-only').show();
            $('#nav-categories-link').hide();
            const fullName = (user.first_name || '') + ' ' + (user.last_name || '');
            $('#user-display-name').text(fullName);
            if (user.image_path) $('#user-avatar').attr('src', user.image_path);
            if (user.role === 'admin') {
                $('#nav-home-link').attr('href', '/admin/dashboard.html').text('Admin');
            }
        } else {
            $('#nav-auth-links').show();
            $('#nav-user').hide();
            $('.nav-auth-only').hide();
            $('#nav-categories-link').show();
        }
    }
    initUserState();

    // ── Cart count ──
    function loadCartCount() {
        if (!token) { $('.cart-count').text('0'); return; }
        $.ajax({
            url: API + '/api/cart',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                const items = (data && data.Cart_Items) ? data.Cart_Items : [];
                let total = 0;
                items.forEach(function (i) { total += (i.quantity || 0); });
                $('.cart-count').text(total);
            },
            error: function () { $('.cart-count').text('0'); }
        });
    }
    loadCartCount();

    // ── Logout handler ──
    $(document).on('click', '#logout-link', function (e) {
        e.preventDefault();
        if (token) {
            $.ajax({
                url: API + '/api/auth/logout',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html?msg=login_required';
    });

    function hasDeliveryAddress(profile) {
        return profile && profile.delivery_address && profile.delivery_address.trim().length > 0;
    }

    function setupDeliveryAddress(profile) {
        if (hasDeliveryAddress(profile)) {
            $('#delivery-address-section').hide();
            $('#delivery-address-note').show();
        } else {
            $('#delivery-address-section').show();
            $('#delivery-address-note').hide();
        }
    }

    function loadProfile() {
        return $.ajax({
            url: API + '/api/profile',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token }
        }).then(function (profile) {
            setupDeliveryAddress(profile);
            return profile;
        }).catch(function () {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                setupDeliveryAddress(user);
            } catch (e) {
                setupDeliveryAddress(null);
            }
        });
    }

    // ── Load cart items ──
    function loadCheckoutItems() {
        $.ajax({
            url: API + '/api/cart',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (res) {
                const items = res.Cart_Items || [];
                renderCheckout(items);

                if (items.length === 0) {
                    $('#empty-cart-message').show();
                    $('#place-order-btn').prop('disabled', true);
                }
            },
            error: function () {
                renderCheckout([]);
                $('#empty-cart-message').show();
            }
        });
    }

    function renderCheckout(items) {
        const $tbody = $('#checkout-items-body').empty();
        let total = 0;

        if (!items || items.length === 0) {
            $tbody.append('<tr id="empty-cart-message"><td colspan="4">Your cart is empty.</td></tr>');
            $('#grand-total').text('$0.00');
            return;
        }

        items.forEach(function (item) {
            const product = item.Product || {};
            const price = parseFloat(item.price || product.price || 0);
            const qty = item.quantity || 1;
            const subtotal = price * qty;
            total += subtotal;

            const row = $('<tr class="cart-item-row"></tr>');
            row.append($('<td></td>').text(product.name || 'Unknown'));
            row.append($('<td></td>').text('$' + price.toFixed(2)));
            row.append($('<td></td>').text(qty));
            row.append($('<td></td>').text('$' + subtotal.toFixed(2)));
            $tbody.append(row);
        });

        $('#grand-total').text('$' + total.toFixed(2));
    }

    // ── Place order ──
    $('#checkout-form').on('submit', function (e) {
        e.preventDefault();
        $('#checkout-error').text('');
        $('#checkout-success').text('');

        const payload = {};

        if ($('#delivery-address-section').is(':visible')) {
            const deliveryAddress = $('#delivery_address').val().trim();
            if (!deliveryAddress) {
                $('#delivery_address-error').text('Please enter a delivery address.');
                return;
            }
            $('#delivery_address-error').text('');
            payload.delivery_address = deliveryAddress;
        }

        $.ajax({
            url: API + '/api/orders',
            method: 'POST',
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + token },
            data: JSON.stringify(payload),
            success: function (res) {
                $('#checkout-success').text('Order placed successfully! Order #' + (res.order_id || res.id || '')).show();
                renderCheckout([]);
                setTimeout(function () {
                    window.location.href = '/index.html';
                }, 2000);
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to place order. Please try again.';
                $('#checkout-error').text(msg);
            }
        });
    });

    // ── Initial load ──
    loadProfile().always(loadCheckoutItems);
});
