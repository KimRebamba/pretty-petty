$(document).ready(function () {
    const API = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    // ── User bar ──
    function initUserBar() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && user && user.id) {
            $('#nav-auth').hide();
            $('#nav-user').css('display', 'inline');
            const fullName = (user.first_name || '') + ' ' + (user.last_name || '');
            $('#user-display-name').text('Hi, ' + fullName);
            if (user.image_path) $('#user-avatar').attr('src', user.image_path);
            $('#user-bar').css('display', 'flex');
            if (user.role === 'admin') {
                $('#user-bar').append('<a href="/admin/dashboard.html" style="margin-left: 10px;">Admin Panel</a>');
            }
        }
    }
    initUserBar();

    // ── Cart count ──
    function loadCartCount() {
        const t = localStorage.getItem('token');
        if (!t) { $('.cart-count').text('0'); return; }
        $.ajax({
            url: API + '/api/cart',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + t },
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
        window.location.href = '/login.html';
    });

    // ── Live search: filter categories + products on page ──
    let searchTimer = null;
    $('#search-input').on('keyup', function () {
        const query = $(this).val().trim().toLowerCase();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            // Filter categories
            $('#categories-container .category-item').each(function () {
                const name = $(this).find('h3').text().toLowerCase();
                $(this).toggle(name.indexOf(query) !== -1);
            });
            // Filter products
            $('#products-container .product-item').each(function () {
                const name = $(this).find('h3').text().toLowerCase();
                $(this).toggle(name.indexOf(query) !== -1);
            });
        }, 200);
    });

    // ── Load categories ──
    $.get(API + '/api/categories', function (categories) {
        const $container = $('#categories-container').empty();
        categories.forEach(function (cat) {
            const card = $('<div class="category-item"></div>').css({
                display: 'inline-block',
                width: '200px',
                margin: '10px',
                verticalAlign: 'top',
                textAlign: 'center'
            });

            if (cat.image_path) {
                card.append($('<img>').attr({ src: cat.image_path, alt: cat.name }).css({ width: '180px', height: '150px', objectFit: 'cover' }));
            }
            card.append($('<h3></h3>').text(cat.name));
            card.append($('<a></a>', {
                href: 'products.html?category_id=' + cat.id,
                text: 'Browse'
            }).css({ display: 'block', marginTop: '5px' }));

            $container.append(card);
        });
    });

    // ── Load featured products ──
    $.get(API + '/api/products', function (products) {
        const $container = $('#products-container').empty();
        const featured = products.slice(0, 8);

        featured.forEach(function (product) {
            const images = product.Product_Images || [];
            const imgSrc = images.length > 0 ? images[0].image_path : '/uploads/placeholder.jpg';
            const outOfStock = !product.stock || product.stock <= 0;

            const card = $('<div class="product-item"></div>').css({
                display: 'inline-block',
                width: '220px',
                margin: '10px',
                verticalAlign: 'top',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center'
            });

            if (outOfStock) {
                // No link — just the image
                card.append(
                    $('<img>').attr({ src: imgSrc, alt: product.name }).css({ width: '200px', height: '180px', objectFit: 'cover' })
                );
                card.append($('<span></span>').text('Out of Stock').css({
                    display: 'inline-block', backgroundColor: '#e74c3c', color: '#fff',
                    padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginTop: '6px'
                }));
            } else {
                card.append(
                    $('<a></a>', { href: 'product_details.html?id=' + product.id }).append(
                        $('<img>').attr({ src: imgSrc, alt: product.name }).css({ width: '200px', height: '180px', objectFit: 'cover' })
                    )
                );
            }

            card.append($('<h3></h3>').text(product.name));
            card.append($('<p></p>').text('$' + parseFloat(product.price).toFixed(2)));
            card.append($('<p></p>').text('Stock: ' + product.stock));

            if (isLoggedIn) {
                if (outOfStock) {
                    card.append($('<button class="add-to-cart-btn"></button>')
                        .text('Add to Cart')
                        .attr('data-product-id', product.id)
                        .prop('disabled', true)
                        .css({ marginTop: '8px', padding: '6px 12px', cursor: 'not-allowed', opacity: 0.5 })
                    );
                } else {
                    const btn = $('<button class="add-to-cart-btn"></button>')
                        .text('Add to Cart')
                        .attr('data-product-id', product.id)
                        .css({ marginTop: '8px', padding: '6px 12px', cursor: 'pointer' });
                    card.append(btn);
                }
            }

            // Wrap entire card in <a> for in-stock products
            if (!outOfStock) {
                const link = $('<a></a>', {
                    href: 'product_details.html?id=' + product.id,
                    css: { textDecoration: 'none', color: 'inherit' }
                });
                card.wrap(link);
            }

            $container.append(card);
        });
    });

    // ── Add to Cart (delegated) ──
    $(document).on('click', '.add-to-cart-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!localStorage.getItem('token')) {
            window.location.href = '/login.html';
            return;
        }
        const productId = $(this).attr('data-product-id');
        $.ajax({
            url: API + '/api/cart',
            method: 'POST',
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
            data: JSON.stringify({ product_id: productId, quantity: 1 }),
            success: function () {
                alert('Added to cart!');
                loadCartCount();
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to add to cart.';
                alert(msg);
            }
        });
    });
});
