$(document).ready(function () {
    const API = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

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

    if (!productId) {
        $('#p-name').text('No product specified.');
        return;
    }

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
        window.location.href = '/index.html?msg=login_required';
    });

    // ── Live search handled by jQuery UI autocomplete (ui-common.js) ──

    // ── Load product ──
    $.get(API + '/api/products/' + productId, function (product) {
        const images = product.Product_Images || [];
        const imgSrc = images.length > 0 ? images[0].image_path : '/uploads/placeholder.jpg';

        $('#p-main-img').attr('src', imgSrc);
        $('#p-name').text(product.name);
        $('#p-category').text(product.Category ? (product.Category.deleted_at ? product.Category.name + ' (deleted)' : product.Category.name) : '');
        $('#p-price').text('$' + parseFloat(product.price).toFixed(2));
        $('#p-stock').text('Stock: ' + product.stock);
        $('#p-description').text(product.description || '');
        $('#p-id').val(product.id);

        // Out-of-stock handling
        if (!product.stock || product.stock <= 0) {
            $('#p-stock').text('Out of Stock').css({ color: '#e74c3c', fontWeight: 'bold' });
            // Disable the add-to-cart form
            const $form = $('#add-to-cart-form');
            $form.find('button[type="submit"]').prop('disabled', true).css({ opacity: 0.5, cursor: 'not-allowed' });
            $form.find('input[name="quantity"]').prop('disabled', true);
            $form.prepend($('<p></p>').text('This product is currently out of stock.').css({ color: '#e74c3c', fontWeight: 'bold', marginBottom: '8px' }));
        }

        // Thumbnails
        const $thumbs = $('#product-thumbnails').empty();
        images.forEach(function (img, i) {
            const thumb = $('<img>').attr({
                src: img.image_path,
                alt: product.name + ' ' + (i + 1),
                'data-img-path': img.image_path
            }).addClass('thumbnail').css({
                width: '80px', height: '80px', objectFit: 'cover',
                cursor: 'pointer', margin: '4px', border: i === 0 ? '3px solid #007bff' : '3px solid #ccc'
            });
            $thumbs.append(thumb);
        });

        $(document).on('click', '.thumbnail', function () {
            const src = $(this).attr('data-img-path');
            $('#p-main-img').attr('src', src);
            $('.thumbnail').css('border-color', '#ccc');
            $(this).css('border-color', '#007bff');
        });
    });

    // ── Add to cart ──
    $('#add-to-cart-form').on('submit', function (e) {
        e.preventDefault();
        if (!isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // Out-of-stock check
        const stockText = $('#p-stock').text();
        if (stockText.indexOf('Out of Stock') !== -1) {
            return;
        }

        $('#cart-error').text('');
        $('#cart-success').text('');

        const qty = parseInt($('#quantity').val(), 10) || 1;
        $.ajax({
            url: API + '/api/cart',
            method: 'POST',
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + token },
            data: JSON.stringify({ product_id: productId, quantity: qty }),
            success: function () {
                $('#cart-success').text('Added to cart!');
                loadCartCount();
                setTimeout(function () { $('#cart-success').text(''); }, 3000);
            },
            error: function (xhr) {
                $('#cart-error').text((xhr.responseJSON && xhr.responseJSON.message) || 'Failed to add to cart.');
            }
        });
    });

    // ── Load reviews (read-only) ──
    function loadReviews() {
        $.get(API + '/api/reviews?product_id=' + productId, function (reviews) {
            const $container = $('#reviews-list-container').empty();
            if (!reviews || reviews.length === 0) {
                $container.append('<p id="no-reviews-message">No reviews yet.</p>');
                return;
            }
            reviews.forEach(function (r) {
                const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                const verified = r.verified_at ? ' <span style="color: green; font-size: 12px;">✓ Verified</span>' : '';
                const div = $('<div class="review-item"></div>').css({ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' });
                div.append($('<p></p>').html('<strong>' + (r.User ? r.User.first_name + ' ' + r.User.last_name : 'Anonymous') + '</strong> - <span>Rating: ' + stars + ' (' + r.rating + '/5)</span>' + verified));
                div.append($('<p></p>').text(r.comment));
                const date = new Date(r.created_at);
                div.append($('<small></small>').text('Reviewed on: ' + date.toLocaleDateString()));
                $container.append(div);
            });
        });
    }
    loadReviews();
});
