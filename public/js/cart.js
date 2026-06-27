$(document).ready(function() {
    var API = 'http://localhost:3000';
    var token = localStorage.getItem('token');

    PrettyPettyUI.apiBase = API;
    PrettyPettyUI.initButtons('button');
    PrettyPettyUI.initProductSearchAutocomplete();

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

    function loadCart() {
        if (!token) {
            $('#cart-table-container').hide();
            $('#empty-cart-message').show();
            $('.cart-count').text('0');
            return;
        }

        $.ajax({
            url: API + '/api/cart',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(cart) {
                var items = cart.Cart_Items || [];
                $('#cart-items-body').empty();

                if (items.length === 0) {
                    $('#cart-table-container').hide();
                    $('#empty-cart-message').show();
                    $('.cart-count').text('0');
                    return;
                }

                $('#cart-table-container').show();
                $('#empty-cart-message').hide();

                var grandTotal = 0;

                items.forEach(function(item) {
                    var product = item.Product;
                    var price = parseFloat(product.price);
                    var qty = item.quantity;
                    var subtotal = price * qty;
                    grandTotal += subtotal;

                    var imgPath = product.Product_Images && product.Product_Images.length > 0
                        ? product.Product_Images[0].image_path
                        : '';

                    var row = '<tr class="cart-row" data-cart-item-id="' + item.id + '" data-product-id="' + product.id + '">' +
                        '<td>' + (imgPath ? '<img src="' + imgPath + '" width="50"> ' : '') + product.name + '</td>' +
                        '<td class="item-price" data-price="' + price + '">$' + price.toFixed(2) + '</td>' +
                        '<td><input type="number" class="quantity-input" value="' + qty + '" min="1" style="width: 50px;"> ' +
                        '<button class="update-qty-btn">Update</button>' +
                        '<span class="error-text qty-error" style="color: red;"></span></td>' +
                        '<td class="item-subtotal">$' + subtotal.toFixed(2) + '</td>' +
                        '<td><button class="remove-item-btn">Clear</button></td>' +
                        '</tr>';
                    $('#cart-items-body').append(row);
                });

                $('#grand-total').text('$' + grandTotal.toFixed(2));
                let totalCount = 0;
                items.forEach(function(i) { totalCount += (i.quantity || 0); });
                $('.cart-count').text(totalCount);
                $('#cart-success, #cart-error').text('');
            },
            error: function(err) {
                $('#cart-error').text(err.responseJSON ? err.responseJSON.message : 'Failed to load cart');
            }
        });
    }

    $(document).on('click', '.update-qty-btn', function() {
        var row = $(this).closest('tr');
        var itemId = row.data('cart-item-id');
        var newQty = parseInt(row.find('.quantity-input').val());

        if (newQty < 1) {
            row.find('.qty-error').text('Quantity must be at least 1');
            return;
        }

        $.ajax({
            url: API + '/api/cart/' + itemId,
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({ quantity: newQty }),
            contentType: 'application/json',
            success: function() {
                $('#cart-success').text('Cart updated');
                loadCart();
            },
            error: function(err) {
                $('#cart-error').text(err.responseJSON ? err.responseJSON.message : 'Failed to update');
            }
        });
    });

    $(document).on('click', '.remove-item-btn', function() {
        var row = $(this).closest('tr');
        var itemId = row.data('cart-item-id');

        PrettyPettyUI.confirm('Take this item out of your cart?', function() {
            $.ajax({
                url: API + '/api/cart/' + itemId,
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token },
                data: JSON.stringify({ quantity: 0 }),
                contentType: 'application/json',
                success: function() {
                    loadCart();
                },
                error: function(err) {
                    $('#cart-error').text(err.responseJSON ? err.responseJSON.message : 'Could not update item');
                }
            });
        });
    });

    loadCart();
});
