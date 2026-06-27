$(document).ready(function() {
    var API = 'http://localhost:3000';
    var token = localStorage.getItem('token');

    PrettyPettyUI.apiBase = API;
    PrettyPettyUI.initButtons('button');
    PrettyPettyUI.initProductSearchAutocomplete();

    // ── User bar ──
    function initUserBar() {
        var user = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && user && user.id) {
            $('#nav-auth').hide();
            $('#nav-user').css('display', 'inline');
            var fullName = (user.first_name || '') + ' ' + (user.last_name || '');
            $('#user-display-name').text('Hi, ' + fullName);
            if (user.image_path) $('#user-avatar').attr('src', user.image_path);
            $('#user-bar').css('display', 'flex');
            if (user.role === 'admin') {
                $('#user-bar').append('<a href="/admin/dashboard.html" style="margin-left: 10px;">Admin Panel</a>');
            }
        }
    }
    initUserBar();

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
        window.location.href = '/login.html';
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
