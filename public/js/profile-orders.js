$(document).ready(function () {
    var API = 'http://localhost:3000';
    var token = localStorage.getItem('token');
    var user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        window.location.href = '/index.html?msg=login_required';
        return;
    }

    PrettyPettyUI.initButtons('button');

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

    function loadCartCount() {
        $.ajax({
            url: API + '/api/cart', method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                var items = (data && data.Cart_Items) ? data.Cart_Items : [];
                var total = 0;
                items.forEach(function (i) { total += (i.quantity || 0); });
                $('.cart-count').text(total);
            },
            error: function () { $('.cart-count').text('0'); }
        });
    }
    loadCartCount();

    $(document).on('click', '#logout-link', function (e) {
        e.preventDefault();
        if (token) {
            $.ajax({ url: API + '/api/auth/logout', method: 'POST', headers: { Authorization: 'Bearer ' + token } });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html?msg=login_required';
    });

    var reviewedProducts = {};

    function checkReviewed(callback) {
        $.ajax({
            url: API + '/api/reviews/my',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (reviews) {
                reviews.forEach(function (r) {
                    reviewedProducts[r.product_id] = r;
                });
                if (callback) callback();
            },
            error: function () { if (callback) callback(); }
        });
    }

    function statusColor(status) {
        if (status === 'Completed') return 'green';
        if (status === 'Cancelled') return 'red';
        if (status === 'Paid') return 'blue';
        return 'orange';
    }

    function canCancel(status) {
        return status === 'Pending' || status === 'Paid';
    }

    function reloadOrders() {
        $('#orders-loading').show();
        $.ajax({
            url: API + '/api/orders/my',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (orders) {
                $('#orders-loading').hide();
                if (!orders || orders.length === 0) {
                    $('#orders-empty').show();
                    $('#orders-list').empty();
                    return;
                }
                $('#orders-empty').hide();
                checkReviewed(function () {
                    renderOrders(orders);
                });
            },
            error: function () {
                $('#orders-loading').text('Failed to load orders.');
            }
        });
    }

    function renderOrders(orders) {
        var html = '';
        orders.forEach(function (order) {
            var itemsHtml = '';
            if (order.Order_Items) {
                order.Order_Items.forEach(function (item) {
                    var unitPrice = parseFloat(item.unit_price || item.price / item.quantity);
                    var lineTotal = parseFloat(item.price);
                    var reviewAction = '';

                    if (order.status === 'Completed') {
                        if (reviewedProducts[item.product_id]) {
                            var r = reviewedProducts[item.product_id];
                            var stars = '';
                            for (var s = 1; s <= 5; s++) stars += s <= r.rating ? '★' : '☆';
                            reviewAction = '<br><span style="color: green; font-size: 12px;">✓ Reviewed ' + stars + '</span>';
                        } else {
                            reviewAction = '<br><a href="review.html?product_id=' + item.product_id + '" style="font-size: 12px;">Write Review</a>';
                        }
                    }

                    itemsHtml += '<tr>' +
                        '<td>' + (item.Product ? '<a href="product_details.html?id=' + item.product_id + '">' + item.Product.name + '</a>' : 'Unknown') + reviewAction + '</td>' +
                        '<td>' + item.quantity + '</td>' +
                        '<td>$' + unitPrice.toFixed(2) + '</td>' +
                        '<td>$' + lineTotal.toFixed(2) + '</td>' +
                        '</tr>';
                });
            }

            var grandTotal = order.Order_Items ? order.Order_Items.reduce(function (sum, i) { return sum + parseFloat(i.price); }, 0) : 0;
            var date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
            var cancelBtn = canCancel(order.status)
                ? '<button class="cancel-order-btn" data-order-id="' + order.id + '" style="padding: 4px 12px; cursor: pointer; color: red; border: 1px solid red; background: white; border-radius: 4px;">Cancel Order</button>'
                : '';

            html += '<div style="border: 1px solid #ccc; border-radius: 8px; padding: 15px; margin-bottom: 15px;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<h3 style="margin: 0;">Order #' + order.id + '</h3>' +
                '<span style="color: ' + statusColor(order.status) + '; font-weight: bold;">' + order.status + '</span>' +
                '</div>' +
                '<p style="color: #666; font-size: 13px;">' + date + '</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">' +
                '<thead><tr style="border-bottom: 1px solid #ddd;"><th style="text-align: left;">Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>' +
                '<tbody>' + itemsHtml + '</tbody>' +
                '</table>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">' +
                '<p style="font-weight: bold; margin: 0;">Grand Total: $' + grandTotal.toFixed(2) + '</p>' +
                cancelBtn +
                '</div>' +
                '</div>';
        });

        $('#orders-list').html(html);
    }

    $(document).on('click', '.cancel-order-btn', function () {
        var orderId = $(this).data('order-id');
        var $btn = $(this);

        PrettyPettyUI.confirm('Are you sure you want to cancel this order?', function () {
            $btn.prop('disabled', true).text('Cancelling...');

            $.ajax({
                url: API + '/api/orders/' + orderId + '/cancel',
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token },
                success: function () {
                    reloadOrders();
                },
                error: function (xhr) {
                    var msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to cancel order.';
                    alert(msg);
                    $btn.prop('disabled', false).text('Cancel Order');
                }
            });
        });
    });

    reloadOrders();
});
