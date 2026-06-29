$(document).ready(function () {
    const API = (function () {
        var origin = window.location.origin;
        var port = window.location.port;
        if (window.location.protocol === 'file:' || !origin || origin === 'null') {
            return 'http://localhost:3000';
        }
        if (port && port !== '3000') {
            return 'http://localhost:3000';
        }
        return origin;
    })();
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    
    // ── Alert banner ──
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg')) {
        const msg = params.get('msg');
        const $banner = $('#alert-banner');
        let text = '';
        if (msg === 'login_required') {
            text = 'You need to be logged in to access that page. <a href="login.html">Log in</a> or <a href="register.html">create an account</a>.';
        } else if (msg === 'admin_required') {
            text = 'You do not have permission to access that page. Admin access required.';
        } else if (msg === 'access_denied') {
            text = 'Access denied. You do not have the required permissions.';
        } else {
            text = msg;
        }
        $banner.html(text).slideDown(200);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }

    // ── User state ──
    function initUserState() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && user && user.id) {
            $('#nav-auth-links').hide();
            $('#nav-user').css('display', 'flex');
            // Show auth-only nav items
            $('.nav-auth-only').show();
            // Hide categories link (replaced by orders/reviews)
            $('#nav-categories-link').hide();

            const fullName = (user.first_name || '') + ' ' + (user.last_name || '');
            $('#user-display-name').text(fullName);
            if (user.image_path) $('#user-avatar').attr('src', user.image_path);

            // Admin: swap Home → Admin link
            if (user.role === 'admin') {
                $('#nav-home-link').attr('href', '/admin/dashboard.html').text('Admin');
            }
        } else {
            // Not logged in
            $('#nav-auth-links').show();
            $('#nav-user').hide();
            $('.nav-auth-only').hide();
            $('#nav-categories-link').show();
        }
    }
    initUserState();

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
   
    // ── Logout ──
    $(document).on('click', '#logout-link', function (e) {
        e.preventDefault();
        if (token) {
            $.ajax({ url: API + '/api/auth/logout', method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    // ── Search bar — jQuery UI autocomplete ──
    $('#search-input').autocomplete({
        source: function (request, response) {
            $.ajax({
                url: API + '/api/search',
                data: { q: request.term },
                success: function (data) {
                    response((Array.isArray(data) ? data : []).map(function (item) {
                        return {
                            label: item.name + ' — $' + parseFloat(item.price).toFixed(2),
                            value: item.name,
                            id: item.id
                        };
                    }));
                },
                error: function () {
                    response([]);
                }
            });
        },
        minLength: 1,
        delay: 200,
        select: function (event, ui) {
            if (ui.item.id) {
                window.location.href = 'product_details.html?id=' + ui.item.id;
            }
            return false;
        },
        appendTo: '.search-bar-wrap',
        classes: { 'ui-autocomplete': 'search-dropdown' }
    });

    // ── Load categories ──
    $.get(API + '/api/categories', function (categories) {
        const $c = $('#categories-container').empty();
        categories.forEach(function (cat, i) {
            const delay = Math.min(i, 5);
            const imgSrc = cat.image_path || '/uploads/placeholder.jpg';
            const card = $(
                '<div class="category-item fade d' + (delay + 1) + '">' +
                    '<a href="products.html?category_id=' + cat.id + '">' +
                        '<div class="category-img-wrap">' +
                            '<img src="' + imgSrc + '" alt="' + cat.name + '">' +
                        '</div>' +
                        '<h3>' + cat.name + '</h3>' +
                    '</a>' +
                '</div>'
            );
            $c.append(card);
        });
        triggerFades();
    });

    // ── Load featured products ──
    $.get(API + '/api/products/top-selling', function (products) {
        const $c = $('#products-container').empty();
        const featured = (Array.isArray(products) ? products : []).slice(0, 9);

        featured.forEach(function (product, i) {
            const images = product.Product_Images || [];
            const imgSrc = images.length > 0 ? images[0].image_path : '/uploads/placeholder.jpg';
            const catName = product.Category ? product.Category.name : '';
            const outOfStock = !product.stock || product.stock <= 0;
            const delay = Math.min(i, 5);

            const card = $('<div class="product-item fade d' + (delay + 1) + '"></div>');

            // Image wrapper — clickable to product details
            const imgWrap = $(
                '<div class="product-img-wrap">' +
                    '<img src="' + imgSrc + '" alt="' + product.name + '">' +
                    (outOfStock ? '<span class="out-of-stock-label">Out of Stock</span>' : '') +
                '</div>'
            );

            // Info section
            const info = $(
                '<div class="product-info">' +
                    '<p class="product-cat-label">' + catName + '</p>' +
                    '<h3>' + product.name + '</h3>' +
                    '<p class="product-price">$' + parseFloat(product.price).toFixed(2) + '</p>' +
                '</div>'
            );

            card.append(imgWrap).append(info);

            // Hover add button (logged-in, in-stock only)
            if (isLoggedIn && !outOfStock) {
                const addBtn = $(
                    '<button class="add-btn-float" data-product-id="' + product.id + '">' +
                        '<span class="iconify" data-icon="lucide:plus" style="font-size:13px;"></span>' +
                    '</button>'
                );
                imgWrap.append(addBtn);
            }

            // Link entire card to product details (in-stock)
            let $productEl = card;
            if (!outOfStock) {
                $productEl = $('<a href="product_details.html?id=' + product.id + '"></a>').append(card);
            }

            $c.append($productEl);
        });
        triggerFades();
    });

    // ── Intersection Observer for fade-in ──
    function triggerFades() {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });

        // Paused initially, play on scroll
        $('#categories-container .fade, #products-container .fade').each(function () {
            this.style.animationPlayState = 'paused';
            observer.observe(this);
        });
    }

    // Hero fades play immediately
    $('.hero .fade').each(function () {
        this.style.animationPlayState = 'running';
    });

    // ── Add to Cart (delegated) ──
    $(document).on('click', '.add-btn-float', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!localStorage.getItem('token')) {
            window.location.href = '/index.html?msg=login_required';
            return;
        }
        const pid = $(this).attr('data-product-id');
        $.ajax({
            url: API + '/api/cart',
            method: 'POST',
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
            data: JSON.stringify({ product_id: pid, quantity: 1 }),
            success: function () {
                loadCartCount();
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to add to cart.';
                alert(msg);
            }
        });
    });
});
